import Joi from 'joi';
import { getPricingFor } from '../constants/pricing.js';

const CAR_PRICING = getPricingFor('car');

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

const phoneField = Joi.string()
  .trim()
  .pattern(/^\d{9,15}$/)
  .messages({ 'string.pattern.base': 'Phone must be 9–15 digits' });

export const createBookingSchema = Joi.object({
  licensePlate: licensePlateField,
  customerEmail: Joi.string().trim().lowercase().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc để nhận xác nhận booking',
  }),
  startTime: Joi.date().iso().required(),
  durationHours: Joi.number()
    .integer()
    .min(CAR_PRICING.blockHours)
    .max(CAR_PRICING.blockHours * CAR_PRICING.maxBlocks)
    .multiple(CAR_PRICING.blockHours)
    .required()
    .messages({
      'number.multiple': `Thời lượng đặt chỗ phải là bội số của ${CAR_PRICING.blockHours} giờ`,
      'number.max': `Chỉ cho phép đặt tối đa ${CAR_PRICING.blockHours * CAR_PRICING.maxBlocks} giờ`,
    }),
  customerName: Joi.string().trim().min(2).max(100),
  customerPhone: phoneField,
  floorId: Joi.number().integer().positive(),
  note: Joi.string().trim().max(500).allow(''),
});

export const listBookingsSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'expired'),
  licensePlate: Joi.string().trim().uppercase(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
