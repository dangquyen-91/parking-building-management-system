import Joi from 'joi';
import { VEHICLE_TYPES, FLOOR_TYPES } from '../models/floor.model.js';

export const createFloorSchema = Joi.object({
  buildingId: Joi.number().integer().positive().required(),
  floorNumber: Joi.number().integer().required(),
  vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
  floorType:   Joi.string().valid(...FLOOR_TYPES).required(),
  totalSlots: Joi.number().integer().min(1).required(),
  description: Joi.string().trim().max(1000).allow('', null),
  isActive: Joi.boolean(),
});

export const updateFloorSchema = Joi.object({
  floorNumber: Joi.number().integer(),
  vehicleType: Joi.string().valid(...VEHICLE_TYPES),
  floorType:   Joi.string().valid(...FLOOR_TYPES),
  totalSlots: Joi.number().integer().min(1),
  description: Joi.string().trim().max(1000).allow('', null),
  isActive: Joi.boolean(),
}).min(1);
