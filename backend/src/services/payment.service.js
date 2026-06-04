import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import Payment from '../models/payment.model.js';
import ResidentSubscription from '../models/resident-subscription.model.js';
import ParkingPackage from '../models/parking-package.model.js';
import ParkingSession from '../models/parking-session.model.js';
import Booking from '../models/booking.model.js';
import AppError from '../utils/appError.js';
import * as vnpayService from './vnpay.service.js';
import { freeSlotIfUnused } from './subscription.service.js';
import { finalizeSessionPayment } from './parking-session.service.js';

export const handleReturn = async (query) => {
  const valid = vnpayService.verifyCallback(query);

  const payment = query.vnp_TxnRef
    ? await Payment.findOne({ where: { orderId: query.vnp_TxnRef } })
    : null;

  if (payment) {
    await payment.update({ rawReturn: JSON.stringify(query) });
  }

  if (!valid) {
    return { success: false, code: '97', message: 'Invalid signature', orderId: query.vnp_TxnRef };
  }

  const success = vnpayService.isSuccessResponse(query.vnp_ResponseCode, query.vnp_TransactionStatus);

  return {
    success,
    code: query.vnp_ResponseCode,
    message: vnpayService.getResponseMessage(query.vnp_ResponseCode),
    orderId: query.vnp_TxnRef,
    amount: payment ? Number(payment.amount) : Number(query.vnp_Amount) / 100,
    status: payment?.status,
    subscriptionId: payment?.subscriptionId || null,
  };
};

/**
 * Compute the start date for an activating subscription. If the same plate
 * already has a valid subscription, the new period stacks on top of it
 * (renewal); otherwise it starts now.
 */
const computePeriod = async (subscription, durationDays, t) => {
  const now = new Date();
  const existing = await ResidentSubscription.findOne({
    where: {
      licensePlate: subscription.licensePlate,
      vehicleType: subscription.vehicleType,
      status: 'active',
      endDate: { [Op.gt]: now },
      id: { [Op.ne]: subscription.id },
    },
    order: [['endDate', 'DESC']],
    transaction: t,
  });

  const startDate = existing ? new Date(existing.endDate) : now;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return { startDate, endDate };
};

/**
 * Activate or cancel a subscription tied to a payment. Assumes the payment row
 * has already been updated and is locked. Resolves the linked subscription if
 * still pending; otherwise no-op (idempotent against replayed IPN).
 */
const handleSubscriptionOutcome = async (payment, success, t) => {
  if (!payment.subscriptionId) return;
  const subscription = await ResidentSubscription.findByPk(payment.subscriptionId, {
    transaction: t,
    lock: t.LOCK.UPDATE,
  });
  if (!subscription || subscription.status !== 'pending') return;

  if (success) {
    const pkg = await ParkingPackage.findByPk(subscription.packageId, { transaction: t });
    const durationDays = pkg ? pkg.durationDays : 30;
    const { startDate, endDate } = await computePeriod(subscription, durationDays, t);
    await subscription.update({ status: 'active', startDate, endDate }, { transaction: t });
  } else {
    await subscription.update({ status: 'cancelled' }, { transaction: t });
    await freeSlotIfUnused(subscription.slotId, subscription.id, t);
  }
};

/**
 * Close the parking session on payment success. On failure we leave the
 * session 'active' so staff can retry payment (cash fallback or new VNPay QR).
 */
const handleSessionOutcome = async (payment, success, t) => {
  if (!payment.sessionId) return;
  if (success) {
    await finalizeSessionPayment(payment.sessionId, Number(payment.amount), t);
  }
  // On failure: session stays active. Staff can call check-out again with
  // another method. The pending row is already marked 'failed' in applyOutcome.
};

/**
 * Booking outcome — delegated to booking.service via dynamic import so this
 * module doesn't crash at startup before the booking module ships.
 *
 * Contract for the booking teammate to implement in booking.service.js:
 *   export const handleBookingPaymentSuccess = async (bookingId, t) => { ... }
 *   export const handleBookingPaymentFailure = async (bookingId, t) => { ... }
 *
 * Both must accept the bookingId + an existing Sequelize transaction (so the
 * update participates in the same atomic IPN handler). They are responsible
 * for whatever booking-side state change makes sense (confirm/cancel, send
 * email, reserve resources, etc).
 */
const handleBookingOutcome = async (payment, success, t) => {
  if (!payment.bookingId) return;
  let bookingService;
  try {
    bookingService = await import('./booking.service.js');
  } catch (err) {
    console.warn(`[booking hook] booking.service.js not yet available — payment ${payment.orderId} processed but no booking-side action: ${err.message}`);
    return;
  }
  const fn = success
    ? bookingService.handleBookingPaymentSuccess
    : bookingService.handleBookingPaymentFailure;
  if (typeof fn !== 'function') {
    console.warn(`[booking hook] booking.service.js missing ${success ? 'handleBookingPaymentSuccess' : 'handleBookingPaymentFailure'} export`);
    return;
  }
  await fn(payment.bookingId, t);
};

/**
 * Apply a confirmed payment outcome (from IPN or queryDr) to a still-pending
 * payment: update the payment row, then branch on paymentType to mutate the
 * linked entity (subscription / session / booking). Assumes `payment` is
 * locked and currently 'pending'.
 */
const applyOutcome = async (payment, { success, vnp, raw, rawField }, t) => {
  await payment.update(
    {
      status: success ? 'success' : 'failed',
      vnpTransactionNo: vnp.vnp_TransactionNo || null,
      vnpResponseCode: vnp.vnp_ResponseCode || null,
      vnpBankCode: vnp.vnp_BankCode || null,
      vnpPayDate: vnp.vnp_PayDate || null,
      paidAt: success ? new Date() : null,
      [rawField]: JSON.stringify(raw),
    },
    { transaction: t }
  );

  switch (payment.paymentType) {
    case 'subscription':
      await handleSubscriptionOutcome(payment, success, t);
      break;
    case 'session':
      await handleSessionOutcome(payment, success, t);
      break;
    case 'booking':
      await handleBookingOutcome(payment, success, t);
      break;
    default:
      break;
  }
};

/**
 * Public API for the booking teammate: build a VNPay payment URL for a
 * booking. Cancels any prior pending payment for the same bookingId so we
 * always have exactly one pending row to reconcile against.
 *
 * Callable inside an existing Sequelize transaction (pass `t`) or standalone
 * (will open its own). Returns { paymentUrl, orderId, paymentId }.
 *
 * Contract:
 *   - `bookingId` (int, required): FK to the bookings table.
 *   - `amount`    (number, required): VND, integer, > 0.
 *   - `ipAddr`    (string, optional): caller IP for vnp_IpAddr.
 *   - `orderInfo` (string, optional): max 255 chars, auto-sanitised to ASCII.
 *
 * After the user pays on VNPay, IPN / queryDr will eventually invoke
 * booking.service.handleBookingPaymentSuccess(bookingId, t). The booking
 * module owns whatever business mutation that implies.
 */
const generateBookingOrderId = () => {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 9).toUpperCase();
  return `BOOK-${ts}-${rand}`;
};

export const createBookingPayment = async ({ bookingId, amount, ipAddr, orderInfo }, externalTxn = null) => {
  if (!bookingId) throw new AppError('bookingId is required', 400);
  const amt = Number(amount);
  if (!amt || amt <= 0) throw new AppError('amount must be greater than 0', 400);

  const run = async (t) => {
    // Cancel prior pending booking payments for this bookingId so retries
    // don't accumulate dangling rows (same logic as checkOutVnpay).
    await Payment.update(
      { status: 'cancelled' },
      {
        where: { bookingId, paymentType: 'booking', status: 'pending' },
        transaction: t,
      }
    );

    const orderId = generateBookingOrderId();
    const safeOrderInfo = (orderInfo || `Booking ${bookingId}`)
      .replace(/[^\x20-\x7E]/g, '')
      .slice(0, 255)
      .trim() || `Booking ${bookingId}`;

    const { paymentUrl, createDate } = vnpayService.createPaymentUrl({
      amount: amt,
      orderId,
      orderInfo: safeOrderInfo,
      ipAddr,
    });

    const payment = await Payment.create(
      {
        orderId,
        provider: 'vnpay',
        paymentMethod: 'vnpay',
        paymentType: 'booking',
        amount: amt,
        orderInfo: safeOrderInfo,
        status: 'pending',
        bookingId,
        ipAddress: ipAddr || null,
        vnpCreateDate: createDate,
      },
      { transaction: t }
    );

    return { paymentUrl, orderId, paymentId: payment.id };
  };

  return externalTxn ? run(externalTxn) : sequelize.transaction(run);
};

export const handleIpn = async (query) => {
  if (!vnpayService.verifyCallback(query)) {
    return { RspCode: '97', Message: 'Invalid Checksum' };
  }

  const orderId = query.vnp_TxnRef;
  const vnpAmount = Number(query.vnp_Amount) / 100;
  const success = vnpayService.isSuccessResponse(query.vnp_ResponseCode, query.vnp_TransactionStatus);

  return sequelize.transaction(async (t) => {
    const payment = await Payment.findOne({ where: { orderId }, transaction: t, lock: t.LOCK.UPDATE });

    if (!payment) return { RspCode: '01', Message: 'Order not found' };
    if (Number(payment.amount) !== vnpAmount) return { RspCode: '04', Message: 'Invalid amount' };
    if (payment.status !== 'pending') return { RspCode: '02', Message: 'Order already confirmed' };

    await applyOutcome(payment, { success, vnp: query, raw: query, rawField: 'rawIpn' }, t);
    return { RspCode: '00', Message: 'Confirm Success' };
  });
};

/**
 * Reconcile a payment by actively asking VNPay (queryDr). Updates the payment
 * and subscription if VNPay reports success but our record is still pending.
 * Works without IPN — usable on localhost and for staff/admin reconciliation.
 */
export const queryPayment = async (orderId, ipAddr) => {
  const payment = await Payment.findOne({ where: { orderId } });
  if (!payment) throw new AppError('Payment not found', 404);
  if (!payment.vnpCreateDate) {
    throw new AppError('Cannot query: original transaction date not recorded for this order', 400);
  }

  const res = await vnpayService.queryTransaction({
    orderId,
    transactionDate: payment.vnpCreateDate,
    ipAddr,
  });

  const queryOk = res.vnp_ResponseCode === '00';
  const paid = queryOk && res.vnp_TransactionStatus === '00';

  // Only mutate if VNPay answered cleanly and our record is still pending.
  if (queryOk && payment.status === 'pending' && res.vnp_TransactionStatus) {
    await sequelize.transaction(async (t) => {
      const locked = await Payment.findOne({ where: { orderId }, transaction: t, lock: t.LOCK.UPDATE });
      if (locked && locked.status === 'pending') {
        await applyOutcome(locked, { success: paid, vnp: res, raw: res, rawField: 'rawIpn' }, t);
      }
    });
  }

  const fresh = await Payment.findOne({
    where: { orderId },
    include: [{ model: ResidentSubscription, as: 'subscription' }],
  });

  return {
    orderId,
    paid,
    queryResponseCode: res.vnp_ResponseCode,
    transactionStatus: res.vnp_TransactionStatus || null,
    message: res.vnp_Message || vnpayService.getResponseMessage(res.vnp_TransactionStatus),
    paymentStatus: fresh.status,
    subscriptionStatus: fresh.subscription?.status || null,
    amount: Number(fresh.amount),
  };
};

/**
 * Look up a payment by orderId with ownership enforcement.
 *
 * Staff/manager/admin can read any payment. Other users may only read
 * payments tied to themselves via `subscription.userId`, `session.userId`, or
 * `booking.userId`. Guest bookings (no userId) and payments not linked to any
 * user are admin-only.
 */
export const getByOrderId = async (orderId, requester) => {
  const payment = await Payment.findOne({
    where: { orderId },
    include: [
      { model: ResidentSubscription, as: 'subscription', attributes: ['id', 'userId', 'status'] },
      { model: ParkingSession, as: 'session', attributes: ['id', 'userId', 'status'] },
      { model: Booking, as: 'booking', attributes: ['id', 'userId', 'status'] },
    ],
  });
  if (!payment) throw new AppError('Payment not found', 404);

  const privileged = ['admin', 'manager', 'staff'].includes(requester?.role);
  if (!privileged) {
    const ownerId =
      payment.subscription?.userId ??
      payment.session?.userId ??
      payment.booking?.userId ??
      null;
    if (!ownerId || ownerId !== requester?.id) {
      throw new AppError('Access denied', 403);
    }
  }
  return payment;
};
