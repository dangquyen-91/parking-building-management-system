import Joi from 'joi';
import { INCIDENT_TYPES } from '../models/incident-report.model.js';

export const listIncidentsSchema = Joi.object({
  type: Joi.string().valid(...INCIDENT_TYPES),
  floorId: Joi.number().integer().positive(),
  licensePlate: Joi.string().trim().max(20),
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')).messages({ 'date.min': 'to must be after from' }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
