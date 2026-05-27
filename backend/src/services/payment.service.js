import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import Payment from '../models/payment.model.js';
import ResidentSubscription from '../models/resident-subscription.model.js';
import ParkingPackage from '../models/parking-package.model.js';
import AppError from '../utils/appError.js';
import * as vnpayService from './vnpay.service.js';
import { freeSlotIfUnused } from './subscription.service.js';

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
 * Apply a confirmed payment outcome (from IPN or queryDr) to a still-pending
 * payment: update the payment row, then activate or cancel the linked
 * subscription. Assumes `payment` is locked and currently 'pending'.
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

export const getByOrderId = async (orderId) => {
  const payment = await Payment.findOne({
    where: { orderId },
    include: [{ model: ResidentSubscription, as: 'subscription' }],
  });
  if (!payment) throw new AppError('Payment not found', 404);
  return payment;
};
