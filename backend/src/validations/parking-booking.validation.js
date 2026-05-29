import Joi from 'joi';
import { BOOKING_STATUSES } from '../models/parking-booking.model.js';

const BOOKABLE_VEHICLE_TYPES = ['car'];

const licensePlateField = Joi.string()
  .trim()
  .min(4)
  .max(20)
  .uppercase()
  .pattern(/^[A-Z0-9\-]+$/)
  .required()
  .messages({
    'string.pattern.base': 'License plate only allows letters, numbers and hyphens',
  });

export const createVisitorBookingSchema = Joi.object({
  floorId: Joi.number().integer().positive().required(),
  vehicleType: Joi.string().valid(...BOOKABLE_VEHICLE_TYPES).required().messages({
    'any.only': 'Visitor booking currently supports car only',
  }),
  customerName: Joi.string().trim().min(2).max(100).required(),
  customerPhone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s]{8,20}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone only allows digits, spaces, plus and hyphen',
    }),
  licensePlate: licensePlateField,
  slotId: Joi.forbidden(),
  rowId: Joi.forbidden(),
  startTime: Joi.date().iso(),
  endTime: Joi.date().iso(),
  durationHours: Joi.number().positive().max(24),
  note: Joi.string().trim().max(500).allow('', null),
});

export const availabilityQuerySchema = Joi.object({
  vehicleType: Joi.string().valid(...BOOKABLE_VEHICLE_TYPES).default('car').messages({
    'any.only': 'Visitor booking availability currently supports car only',
  }),
});

export const myBookingsQuerySchema = Joi.object({
  customerPhone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s]{8,20}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone only allows digits, spaces, plus and hyphen',
    }),
  licensePlate: Joi.string()
    .trim()
    .min(4)
    .max(20)
    .uppercase()
    .pattern(/^[A-Z0-9\-]+$/)
    .messages({
      'string.pattern.base': 'License plate only allows letters, numbers and hyphens',
    }),
});

export const bookingQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...BOOKING_STATUSES).allow('', null),
  vehicleType: Joi.string().valid(...BOOKABLE_VEHICLE_TYPES),
  search: Joi.string().trim().max(50).allow('', null),
});

export const staffBookingActionSchema = Joi.object({
  slotId: Joi.number().integer().positive(),
  staffNote: Joi.string().trim().max(500).allow('', null),
});
