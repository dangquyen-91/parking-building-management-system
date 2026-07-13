import * as parkingSessionService from '../services/parking-session.service.js';
import response from '../utils/response.js';

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

const checkIn = async (req, res, next) => {
  try {
    const session = await parkingSessionService.checkIn(req.body, req.user.id);
    response.success(res, session, 201);
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const result = await parkingSessionService.getSessions(req.query);
    response.paginated(res, result.sessions, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getActiveSessions = getSessions;

const getOne = async (req, res, next) => {
  try {
    const session = await parkingSessionService.getById(req.params.id);
    response.success(res, session);
  } catch (err) {
    next(err);
  }
};

const lookup = async (req, res, next) => {
  try {
    const result = await parkingSessionService.lookup(req.query.licensePlate);
    response.success(res, result);
  } catch (err) {
    next(err);
  }
};

const previewCheckout = async (req, res, next) => {
  try {
    const result = await parkingSessionService.previewCheckout(req.params.id);
    response.success(res, result);
  } catch (err) {
    next(err);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const method = req.body?.paymentMethod || 'cash';
    if (method !== 'cash' && method !== 'vnpay') {
      return response.error(res, "paymentMethod must be 'cash' or 'vnpay'", 400);
    }

    const result =
      method === 'vnpay'
        ? await parkingSessionService.checkOutVnpay(req.params.id, req.user.id, getClientIp(req))
        : await parkingSessionService.checkOutCash(req.params.id, req.user.id);

    response.success(res, result);
  } catch (err) {
    next(err);
  }
};

export { checkIn, getSessions, getActiveSessions, getOne, lookup, previewCheckout, checkOut };
