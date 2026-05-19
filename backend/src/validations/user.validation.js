import Joi from 'joi';
import { ROLES } from '../constants/roles.js';

const phonePattern = /^[0-9+\-\s]{7,15}$/;

export const updateMeSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100),
  phone: Joi.string().trim().pattern(phonePattern).messages({
    'string.pattern.base': 'Phone number is invalid',
  }),
});

export const updateUserSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100),
  email: Joi.string().email().lowercase().trim(),
  phone: Joi.string().trim().pattern(phonePattern).messages({
    'string.pattern.base': 'Phone number is invalid',
  }),
});

export const changeRoleSchema = Joi.object({
  role: Joi.string()
    .valid(...ROLES)
    .required()
    .messages({
      'any.only': `Role must be one of: ${ROLES.join(', ')}`,
    }),
});

export const updateStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});
