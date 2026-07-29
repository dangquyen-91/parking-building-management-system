import Joi from 'joi';
import { getPricingFor } from '../constants/pricing.js';
import { LICENSE_PLATE_PATTERN, licensePlateMessages } from '../utils/licensePlate.js';

const CAR_PRICING = getPricingFor('car');

const licensePlateField = Joi.string()
  .trim()
  .min(8)
  .max(11)
  .uppercase()
  .pattern(LICENSE_PLATE_PATTERN)
  .required()
  .messages(licensePlateMessages);

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
    .min(1)
    .max(CAR_PRICING.maxHours)
    .required()
    .messages({
      'number.min': 'Thời lượng đặt tối thiểu 1 giờ',
      'number.max': `Chỉ cho phép đặt tối đa ${CAR_PRICING.maxHours} giờ`,
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
