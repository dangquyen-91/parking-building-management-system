import * as subscriptionService from '../services/subscription.service.js';
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

const buy = async (req, res, next) => {
  try {
    const privileged = ['admin', 'manager', 'staff'].includes(req.user.role);
    const userId = privileged && req.body.userId ? req.body.userId : req.user.id;

    const result = await subscriptionService.buyPackage({
      userId,
      packageId: req.body.packageId,
      licensePlate: req.body.licensePlate,
      slotId: req.body.slotId,
      ipAddr: getClientIp(req),
    });
    response.success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getMine = async (req, res, next) => {
  try {
    const subs = await subscriptionService.getMine(req.user.id, req.query);
    response.success(res, subs);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const subs = await subscriptionService.getAll(req.query);
    response.success(res, subs);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const sub = await subscriptionService.getById(req.params.id, req.user);
    response.success(res, sub);
  } catch (err) {
    next(err);
  }
};

const getActiveByPlate = async (req, res, next) => {
  try {
    const sub = await subscriptionService.getActiveByPlate(req.query.licensePlate);
    response.success(res, { active: !!sub, subscription: sub });
  } catch (err) {
    next(err);
  }
};

const expire = async (req, res, next) => {
  try {
    const result = await subscriptionService.expireSubscriptions();
    response.success(res, result);
  } catch (err) {
    next(err);
  }
};

export { buy, getMine, getAll, getById, getActiveByPlate, expire };
