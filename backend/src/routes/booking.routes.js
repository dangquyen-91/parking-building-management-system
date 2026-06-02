import { Router } from 'express';
import {
  authenticate,
  authorize,
  optionalAuthenticate,
} from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as bookingController from '../controllers/booking.controller.js';
import {
  createBookingSchema,
  listBookingsSchema,
} from '../validations/booking.validation.js';

const router = Router();

// Public — guest can book; if a Bearer token is supplied, req.user gets set.
router.post('/', optionalAuthenticate, validate(createBookingSchema), bookingController.create);

// Admin sweep — declared before /:id so it doesn't get swallowed by it.
router.post('/expire', authenticate, authorize('admin', 'manager'), bookingController.expire);

// User-facing self lookup
router.get('/me', authenticate, bookingController.getMine);

// Staff/admin listing
router.get(
  '/',
  authenticate,
  authorize('admin', 'manager', 'staff'),
  validate(listBookingsSchema, 'query'),
  bookingController.getAll
);

// Owner or staff
router.get('/:id', authenticate, bookingController.getOne);

// Owner or staff/admin/manager
router.post('/:id/cancel', authenticate, bookingController.cancel);

export default router;
