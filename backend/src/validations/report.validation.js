import Joi from 'joi';

const dateRangeFields = {
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')).messages({
    'date.min': 'to must be after from',
  }),
};

const groupByField = Joi.string().valid('day', 'week', 'month').default('day');

export const revenueSchema = Joi.object({
  ...dateRangeFields,
  groupBy: groupByField,
});

export const revenueByVehicleSchema = Joi.object({
  ...dateRangeFields,
  groupBy: groupByField,
});

export const revenueComparisonSchema = Joi.object({
  period: Joi.string().valid('week', 'month', 'year').default('month'),
});

export const dateRangeSchema = Joi.object({
  ...dateRangeFields,
});

export const occupancyTrendSchema = Joi.object({
  ...dateRangeFields,
  floorId: Joi.number().integer().positive(),
});

export const peakHoursSchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
});

export const topVehiclesSchema = Joi.object({
  ...dateRangeFields,
  limit: Joi.number().integer().min(1).max(100).default(10),
  vehicleType: Joi.string().valid('motorcycle', 'car'),
});
