import Joi from 'joi';

const passwordRules = Joi.string()
  .min(8)
  .max(72)
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[0-9]/, 'digit')
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.max': 'Password must not exceed 72 characters',
    'string.pattern.name': 'Password must contain at least one {#name} letter',
  });

const phonePattern = /^[0-9+\-\s]{7,15}$/;

export const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: passwordRules,
  phone: Joi.string().trim().pattern(phonePattern).optional().messages({
    'string.pattern.base': 'Phone number is invalid',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
