import Joi from 'joi';
import { ROW_STATUSES } from '../models/parking-row.model.js';

export const createParkingRowSchema = Joi.object({
  floorId: Joi.number().integer().positive().required(),
  rowCode: Joi.string().trim().min(1).max(20).required(),
  capacity: Joi.number().integer().min(1).max(500).required(),
  note: Joi.string().trim().max(1000).allow('', null),
});

export const updateParkingRowSchema = Joi.object({
  rowCode: Joi.string().trim().min(1).max(20),
  capacity: Joi.number().integer().min(1).max(500),
  note: Joi.string().trim().max(1000).allow('', null),
}).min(1);

export const updateRowStatusSchema = Joi.object({
  status: Joi.string().valid(...ROW_STATUSES).required(),
  note: Joi.string().trim().max(1000).allow('', null),
});
