import Joi from 'joi';
import { VEHICLE_TYPES } from '../models/floor.model.js';

export const checkInSchema = Joi.object({
  slotId: Joi.number().integer().positive().required(),
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
  vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
  userId: Joi.number().integer().positive().allow(null),
  note: Joi.string().trim().max(500).allow('', null),
});
