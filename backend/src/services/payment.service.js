import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import SubscriptionPayment from '../models/subscription-payment.model.js';
import BookingPayment from '../models/booking-payment.model.js';
import SessionPayment from '../models/session-payment.model.js';
import ResidentSubscription from '../models/resident-subscription.model.js';
import ParkingPackage from '../models/parking-package.model.js';
import ParkingSession from '../models/parking-session.model.js';
import Booking from '../models/booking.model.js';
import AppError from '../utils/appError.js';
import * as vnpayService from './vnpay.service.js';
import { freeSlotIfUnused } from './subscription.service.js';
import { finalizeSessionPayment } from './parking-session.service.js';

const TYPE_BY_PREFIX = {
  'SUB-': { model: SubscriptionPayment, kind: 'subscription' },
  'BOOK-': { model: BookingPayment,      kind: 'booking' },
  'SESS-': { model: SessionPayment,      kind: 'session' },
};

const resolveByOrderId = (orderId) => {
  if (!orderId) return null;
  for (const [prefix, cfg] of Object.entries(TYPE_BY_PREFIX)) {
    if (orderId.startsWith(prefix)) return cfg;
  }
  return null;
};

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

const handleSubscriptionOutcome = async (payment, success, t) => {
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

const handleSessionOutcome = async (payment, success, t) => {
  if (success) {
    await finalizeSessionPayment(payment.sessionId, Number(payment.amount), t);
  }
};

const handleBookingOutcome = async (payment, success, t) => {
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
  if (typeof fn !== 'function') return;
  await fn(payment.bookingId, t, payment.orderId);
};

const OUTCOME_HANDLERS = {
  subscription: handleSubscriptionOutcome,
  booking: handleBookingOutcome,
  session: handleSessionOutcome,
};

const applyOutcome = async (payment, kind, { success, vnp, raw, rawField }, t) => {
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

  const handler = OUTCOME_HANDLERS[kind];
  if (handler) await handler(payment, success, t);
};

export const handleReturn = async (query) => {
  const orderId = query.vnp_TxnRef;
  const valid = vnpayService.verifyCallback(query);
  const route = resolveByOrderId(orderId);

  if (orderId && route) {
    await route.model.update(
      { rawReturn: JSON.stringify(query) },
      { where: { orderId } }
    );
  }

  if (!valid) {
    return { success: false, code: '97', message: 'Invalid signature', orderId };
  }
  if (!route) {
    return { success: false, code: '01', message: 'Unknown order prefix', orderId };
  }

  const success = vnpayService.isSuccessResponse(query.vnp_ResponseCode, query.vnp_TransactionStatus);
  const vnpAmount = Number(query.vnp_Amount) / 100;

  await sequelize.transaction(async (t) => {
    const payment = await route.model.findOne({
      where: { orderId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!payment) return;
    if (Number(payment.amount) !== vnpAmount) return;
    if (payment.status !== 'pending') return;

    await applyOutcome(payment, route.kind, { success, vnp: query, raw: query, rawField: 'rawReturn' }, t);
  });

  const fresh = await route.model.findOne({ where: { orderId } });

  return {
    success,
    code: query.vnp_ResponseCode,
    message: vnpayService.getResponseMessage(query.vnp_ResponseCode),
    orderId,
    amount: fresh ? Number(fresh.amount) : vnpAmount,
    status: fresh?.status,
    kind: route.kind,
  };
};

export const handleIpn = async (query) => {
  if (!vnpayService.verifyCallback(query)) {
    return { RspCode: '97', Message: 'Invalid Checksum' };
  }

  const orderId = query.vnp_TxnRef;
  const route = resolveByOrderId(orderId);
  if (!route) return { RspCode: '01', Message: 'Order not found' };

  const vnpAmount = Number(query.vnp_Amount) / 100;
  const success = vnpayService.isSuccessResponse(query.vnp_ResponseCode, query.vnp_TransactionStatus);

  return sequelize.transaction(async (t) => {
    const payment = await route.model.findOne({
      where: { orderId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!payment) return { RspCode: '01', Message: 'Order not found' };
    if (Number(payment.amount) !== vnpAmount) return { RspCode: '04', Message: 'Invalid amount' };
    if (payment.status !== 'pending') return { RspCode: '02', Message: 'Order already confirmed' };

    await applyOutcome(payment, route.kind, { success, vnp: query, raw: query, rawField: 'rawIpn' }, t);
    return { RspCode: '00', Message: 'Confirm Success' };
  });
};

export const queryPayment = async (orderId, ipAddr, _requester) => {
  const route = resolveByOrderId(orderId);
  if (!route) throw new AppError('Unknown order prefix', 400);

  const payment = await route.model.findOne({ where: { orderId } });
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

  if (queryOk && payment.status === 'pending' && res.vnp_TransactionStatus) {
    await sequelize.transaction(async (t) => {
      const locked = await route.model.findOne({ where: { orderId }, transaction: t, lock: t.LOCK.UPDATE });
      if (locked && locked.status === 'pending') {
        await applyOutcome(locked, route.kind, { success: paid, vnp: res, raw: res, rawField: 'rawIpn' }, t);
      }
    });
  }

  const fresh = await route.model.findOne({ where: { orderId } });

  return {
    orderId,
    paid,
    kind: route.kind,
    queryResponseCode: res.vnp_ResponseCode,
    transactionStatus: res.vnp_TransactionStatus || null,
    message: res.vnp_Message || vnpayService.getResponseMessage(res.vnp_TransactionStatus),
    paymentStatus: fresh.status,
    amount: Number(fresh.amount),
  };
};

export const getByOrderId = async (orderId, requester) => {
  const route = resolveByOrderId(orderId);
  if (!route) throw new AppError('Unknown order prefix', 400);

  const include =
    route.kind === 'subscription'
      ? [{ model: ResidentSubscription, as: 'subscription', attributes: ['id', 'userId', 'status'] }]
      : route.kind === 'session'
        ? [{ model: ParkingSession, as: 'session', attributes: ['id', 'userId', 'status'] }]
        : [{ model: Booking, as: 'booking', attributes: ['id', 'userId', 'status'] }];

  const payment = await route.model.findOne({ where: { orderId }, include });
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

const generateOrderId = (prefix) => {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 9).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
};

export const createSubscriptionPayment = async ({ subscriptionId, amount, ipAddr, orderInfo }, externalTxn = null) => {
  if (!subscriptionId) throw new AppError('subscriptionId is required', 400);
  const amt = Number(amount);
  if (!amt || amt <= 0) throw new AppError('amount must be greater than 0', 400);

  const run = async (t) => {
    const orderId = generateOrderId('SUB');
    const safeInfo = (orderInfo || `Goi ${subscriptionId}`).replace(/[^\x20-\x7E]/g, '').slice(0, 255);
    const { paymentUrl, createDate } = vnpayService.createPaymentUrl({ amount: amt, orderId, orderInfo: safeInfo, ipAddr });

    const payment = await SubscriptionPayment.create(
      {
        orderId,
        provider: 'vnpay',
        paymentMethod: 'vnpay',
        amount: amt,
        orderInfo: safeInfo,
        status: 'pending',
        subscriptionId,
        ipAddress: ipAddr || null,
        vnpCreateDate: createDate,
      },
      { transaction: t }
    );

    return { paymentUrl, orderId, paymentId: payment.id };
  };

  return externalTxn ? run(externalTxn) : sequelize.transaction(run);
};

export const createBookingPayment = async ({ bookingId, amount, ipAddr, orderInfo }, externalTxn = null) => {
  if (!bookingId) throw new AppError('bookingId is required', 400);
  const amt = Number(amount);
  if (!amt || amt <= 0) throw new AppError('amount must be greater than 0', 400);

  const run = async (t) => {
    await BookingPayment.update(
      { status: 'cancelled' },
      { where: { bookingId, status: 'pending' }, transaction: t }
    );

    const orderId = generateOrderId('BOOK');
    const safeInfo = (orderInfo || `Booking ${bookingId}`).replace(/[^\x20-\x7E]/g, '').slice(0, 255).trim() || `Booking ${bookingId}`;

    const { paymentUrl, createDate } = vnpayService.createPaymentUrl({ amount: amt, orderId, orderInfo: safeInfo, ipAddr });

    const payment = await BookingPayment.create(
      {
        orderId,
        provider: 'vnpay',
        paymentMethod: 'vnpay',
        amount: amt,
        orderInfo: safeInfo,
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

export const createSessionPayment = async ({ sessionId, amount, ipAddr, orderInfo }, externalTxn = null) => {
  if (!sessionId) throw new AppError('sessionId is required', 400);
  const amt = Number(amount);
  if (!amt || amt <= 0) throw new AppError('amount must be greater than 0', 400);

  const run = async (t) => {
    await SessionPayment.update(
      { status: 'cancelled' },
      { where: { sessionId, status: 'pending' }, transaction: t }
    );

    const orderId = generateOrderId('SESS');
    const safeInfo = (orderInfo || `Phi gui xe session ${sessionId}`).replace(/[^\x20-\x7E]/g, '').slice(0, 255);

    const { paymentUrl, createDate } = vnpayService.createPaymentUrl({ amount: amt, orderId, orderInfo: safeInfo, ipAddr });

    const payment = await SessionPayment.create(
      {
        orderId,
        provider: 'vnpay',
        paymentMethod: 'vnpay',
        amount: amt,
        orderInfo: safeInfo,
        status: 'pending',
        sessionId,
        ipAddress: ipAddr || null,
        vnpCreateDate: createDate,
      },
      { transaction: t }
    );

    return { paymentUrl, orderId, paymentId: payment.id };
  };

  return externalTxn ? run(externalTxn) : sequelize.transaction(run);
};

export const recordCashSessionPayment = async ({ sessionId, amount, orderInfo, paidAt = new Date() }, t) => {
  const orderId = generateOrderId('SESS');
  const safeInfo = (orderInfo || `Cash for session ${sessionId}`).replace(/[^\x20-\x7E]/g, '').slice(0, 255);
  return SessionPayment.create(
    {
      orderId,
      provider: 'vnpay',
      paymentMethod: 'cash',
      amount,
      orderInfo: safeInfo,
      status: 'success',
      sessionId,
      paidAt,
    },
    { transaction: t }
  );
};
