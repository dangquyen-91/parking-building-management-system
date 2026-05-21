import Joi from 'joi';

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
    'string.empty': 'Current password is required',
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'any.required': 'New password is required',
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Confirm password must match new password',
    'any.required': 'Confirm password is required',
    'string.empty': 'Confirm password is required',
  }),
});
