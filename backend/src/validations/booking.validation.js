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

const phoneField = Joi.string()
  .trim()
  .pattern(/^\d{9,15}$/)
  .messages({ 'string.pattern.base': 'Phone must be 9–15 digits' });

/**
 * Customer-facing booking creation. Guests must include customerName +
 * customerPhone; logged-in users may omit (BE auto-fills from profile but
 * can override here, e.g. resident "book hộ" with different contact).
 *
 * floorId is optional — BE auto-picks the first active visitor car floor.
 */
export const createBookingSchema = Joi.object({
  licensePlate: licensePlateField,
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
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
