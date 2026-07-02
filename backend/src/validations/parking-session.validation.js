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

export const checkOutSchema = Joi.object({
  paymentMethod: Joi.string().valid('cash', 'vnpay').default('cash'),
  lostTicket: Joi.boolean().default(false),
  lostTicketNote: Joi.string().trim().max(500).allow('', null),
});
