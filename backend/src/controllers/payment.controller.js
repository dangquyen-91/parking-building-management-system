import * as paymentService from '../services/payment.service.js';
import { vnpayConfig } from '../config/vnpay.config.js';
import response from '../utils/response.js';

const vnpayReturn = async (req, res, next) => {
  try {
    const result = await paymentService.handleReturn(req.query);
    const redirectUrl = `${vnpayConfig.frontendReturnUrl}?status=${result.success ? 'success' : 'failed'}&code=${result.code || ''}&orderId=${result.orderId || ''}`;
    res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
};

const vnpayIpn = async (req, res, next) => {
  try {
    const result = await paymentService.handleIpn(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getByOrderId = async (req, res, next) => {
  try {
    const payment = await paymentService.getByOrderId(req.params.orderId);
    response.success(res, payment);
  } catch (err) {
    next(err);
  }
};

const getClientIp = (req) => {
  let ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
};

const query = async (req, res, next) => {
  try {
    const result = await paymentService.queryPayment(req.params.orderId, getClientIp(req));
    response.success(res, result);
  } catch (err) {
    next(err);
  }
};

export { vnpayReturn, vnpayIpn, getByOrderId, query };
