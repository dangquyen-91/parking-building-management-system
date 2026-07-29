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

router.post('/', optionalAuthenticate, validate(createBookingSchema), bookingController.create);

router.get('/availability', bookingController.getAvailability);

router.post('/expire', authenticate, authorize('manager'), bookingController.expire);

router.get('/me', authenticate, bookingController.getMine);

router.get(
  '/',
  authenticate,
  authorize('admin', 'manager', 'staff'),
  validate(listBookingsSchema, 'query'),
  bookingController.getAll
);

router.get('/:id', authenticate, bookingController.getOne);

router.post('/:id/cancel', authenticate, bookingController.cancel);

export default router;
