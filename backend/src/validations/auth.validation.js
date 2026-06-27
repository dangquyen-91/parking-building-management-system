import Joi from 'joi';

export const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    'any.required': 'Họ tên là bắt buộc',
    'string.empty': 'Họ tên là bắt buộc',
    'string.min': 'Họ tên phải có ít nhất 2 ký tự',
    'string.max': 'Họ tên không được quá 100 ký tự',
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'Email là bắt buộc',
    'string.empty': 'Email là bắt buộc',
    'string.email': 'Email không hợp lệ',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'any.required': 'Mật khẩu là bắt buộc',
    'string.empty': 'Mật khẩu là bắt buộc',
    'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
    'string.max': 'Mật khẩu không được quá 128 ký tự',
  }),
  phone: Joi.string().pattern(/^[0-9]{9,11}$/).optional().messages({
    'string.pattern.base': 'Số điện thoại không hợp lệ (9-11 chữ số)',
  }),
});

export const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': 'Email là bắt buộc',
    'string.empty': 'Email là bắt buộc',
    'string.email': 'Email không hợp lệ',
  }),
});

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
