import * as parkingBookingService from '../services/parking-booking.service.js';
import response from '../utils/response.js';

const createVisitorBooking = async (req, res, next) => {
  try {
    if (['admin', 'manager', 'staff'].includes(req.user?.role)) {
      return response.error(res, 'Admin, manager and staff accounts cannot create visitor bookings', 403);
    }

    const userId = req.user?.id || null;
    const booking = await parkingBookingService.createVisitorBooking(req.body, userId);
    response.success(res, booking, 201);
  } catch (err) {
    next(err);
  }
};

const getVisitorAvailability = async (req, res, next) => {
  try {
    const availability = await parkingBookingService.getVisitorAvailability(req.query);
    response.success(res, availability);
  } catch (err) {
    next(err);
  }
};

const getMinePublic = async (req, res, next) => {
  try {
    const bookings = await parkingBookingService.getMinePublic(req.query);
    response.success(res, bookings);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await parkingBookingService.getAll(req.query);
    response.paginated(res, result.bookings, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const booking = await parkingBookingService.getById(req.params.id);
    response.success(res, booking);
  } catch (err) {
    next(err);
  }
};

const confirm = async (req, res, next) => {
  try {
    const booking = await parkingBookingService.confirm(req.params.id, req.user.id, req.body);
    response.success(res, booking);
  } catch (err) {
    next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const booking = await parkingBookingService.reject(req.params.id, req.user.id, req.body);
    response.success(res, booking);
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const booking = await parkingBookingService.cancel(req.params.id, req.user.id, req.body);
    response.success(res, booking);
  } catch (err) {
    next(err);
  }
};

export { createVisitorBooking, getVisitorAvailability, getMinePublic, getAll, getById, confirm, reject, cancel };
