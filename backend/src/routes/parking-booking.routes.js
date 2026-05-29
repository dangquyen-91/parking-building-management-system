import { Router } from 'express';
import { authenticate, authenticateOptional, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as parkingBookingController from '../controllers/parking-booking.controller.js';
import {
  availabilityQuerySchema,
  bookingQuerySchema,
  createVisitorBookingSchema,
  myBookingsQuerySchema,
  staffBookingActionSchema,
} from '../validations/parking-booking.validation.js';

const router = Router();

// Visitors can create bookings without an account. Resident packages do not use this flow.
router.get('/availability', validate(availabilityQuerySchema, 'query'), parkingBookingController.getVisitorAvailability);
router.get('/my', validate(myBookingsQuerySchema, 'query'), parkingBookingController.getMinePublic);
router.post('/', authenticateOptional, validate(createVisitorBookingSchema), parkingBookingController.createVisitorBooking);

router.use(authenticate);

router.get(
  '/',
  authorize('admin', 'manager', 'staff'),
  validate(bookingQuerySchema, 'query'),
  parkingBookingController.getAll
);
router.get('/:id', authorize('admin', 'manager', 'staff'), parkingBookingController.getById);
router.post(
  '/:id/confirm',
  authorize('admin', 'manager', 'staff'),
  validate(staffBookingActionSchema),
  parkingBookingController.confirm
);
router.post(
  '/:id/reject',
  authorize('admin', 'manager', 'staff'),
  validate(staffBookingActionSchema),
  parkingBookingController.reject
);
router.post(
  '/:id/cancel',
  authorize('admin', 'manager', 'staff'),
  validate(staffBookingActionSchema),
  parkingBookingController.cancel
);

export default router;
