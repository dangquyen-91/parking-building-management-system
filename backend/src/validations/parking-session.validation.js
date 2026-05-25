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

  // car: slotId bắt buộc, rowId không được có
  slotId: Joi.number().integer().positive().when('vehicleType', {
    is: 'car',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  // motorcycle: rowId bắt buộc, slotId không được có
  rowId: Joi.number().integer().positive().when('vehicleType', {
    is: 'motorcycle',
    then: Joi.required(),
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
