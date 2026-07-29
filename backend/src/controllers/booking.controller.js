import * as bookingService from '../services/booking.service.js';
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

const create = async (req, res, next) => {
  try {
    const result = await bookingService.createBooking({
      body: req.body,
      requester: req.user,
      ipAddr: getClientIp(req),
    });
    response.success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getMine = async (req, res, next) => {
  try {
    const data = await bookingService.getMine(req.user.id);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getAvailability = async (_req, res, next) => {
  try {
    const data = await bookingService.getAvailability();
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getOne = async (req, res, next) => {
  try {
    const data = await bookingService.getById(req.params.id, req.user);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await bookingService.getAll(req.query);
    response.paginated(res, result.bookings, result.pagination);
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const data = await bookingService.cancelBooking(req.params.id, req.user);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const expire = async (_req, res, next) => {
  try {
    const data = await bookingService.expireBookings();
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

export { create, getAvailability, getMine, getOne, getAll, cancel, expire };
