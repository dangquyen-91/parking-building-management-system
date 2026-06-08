import Joi from 'joi';

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

export const buyPackageSchema = Joi.object({
  packageId: Joi.number().integer().positive().required(),
  licensePlate: licensePlateField,
  slotId: Joi.number().integer().positive(),
  userId: Joi.number().integer().positive(),
});

export const activePlateSchema = Joi.object({
  licensePlate: licensePlateField,
});
