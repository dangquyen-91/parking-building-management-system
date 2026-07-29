import Joi from 'joi';
import { LICENSE_PLATE_PATTERN, licensePlateMessages } from '../utils/licensePlate.js';

const licensePlateBase = Joi.string()
  .trim()
  .min(8)
  .max(11)
  .uppercase()
  .pattern(LICENSE_PLATE_PATTERN)
  .messages(licensePlateMessages);

const vehicleTypeField = Joi.string().valid('motorcycle', 'car');
const nicknameField = Joi.string().trim().max(50).allow('');

export const createVehicleSchema = Joi.object({
  licensePlate: licensePlateBase.required(),
  vehicleType: vehicleTypeField.required(),
  nickname: nicknameField,
});

export const updateVehicleSchema = Joi.object({
  licensePlate: licensePlateBase,
  vehicleType: vehicleTypeField,
  nickname: nicknameField,
}).min(1);
