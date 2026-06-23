import Joi from 'joi';

const licensePlateBase = Joi.string()
  .trim()
  .min(4)
  .max(20)
  .uppercase()
  .pattern(/^[A-Z0-9\-]+$/)
  .messages({
    'string.pattern.base': 'License plate only allows letters, numbers and hyphens',
  });

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
