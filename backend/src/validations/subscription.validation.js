import Joi from 'joi';
import { LICENSE_PLATE_PATTERN, licensePlateMessages } from '../utils/licensePlate.js';

const licensePlateField = Joi.string()
  .trim()
  .min(8)
  .max(11)
  .uppercase()
  .pattern(LICENSE_PLATE_PATTERN)
  .required()
  .messages(licensePlateMessages);

export const buyPackageSchema = Joi.object({
  packageId: Joi.number().integer().positive().required(),
  licensePlate: licensePlateField,
  slotId: Joi.number().integer().positive(),
  userId: Joi.number().integer().positive(),
});

export const activePlateSchema = Joi.object({
  licensePlate: licensePlateField,
});
