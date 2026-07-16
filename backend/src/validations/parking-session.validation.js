import Joi from 'joi';
import { VEHICLE_TYPES } from '../models/floor.model.js';

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

export const checkInSchema = Joi.object({
  vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
  licensePlate: licensePlateField,
  floorId: Joi.number().integer().positive().required(),

  rowId: Joi.number().integer().positive().when('vehicleType', {
    is: 'motorcycle',
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),

  userId: Joi.number().integer().positive().allow(null),
  note: Joi.string().trim().max(500).allow('', null),
});

export const lookupSchema = Joi.object({
  licensePlate: Joi.string()
    .trim()
    .min(4)
    .max(20)
    .uppercase()
    .pattern(/^[A-Z0-9\-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'License plate only allows letters, numbers and hyphens',
    }),
});

export const listSessionsSchema = Joi.object({
  status: Joi.string().valid('active', 'completed', 'cancelled', 'all').default('active'),
  customerType: Joi.string().valid('resident', 'visitor', 'booking'),
  vehicleType: Joi.string().valid(...VEHICLE_TYPES),
  paymentStatus: Joi.string().valid('paid', 'unpaid'),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  buildingId: Joi.number().integer().positive(),
  floorId: Joi.number().integer().positive(),
  search: Joi.string().trim().max(20),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const checkOutSchema = Joi.object({
  paymentMethod: Joi.string().valid('cash', 'vnpay').default('cash'),
});
