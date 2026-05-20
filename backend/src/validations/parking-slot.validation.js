import Joi from 'joi';
import { SLOT_STATUSES } from '../models/parking-slot.model.js';
import { VEHICLE_TYPES } from '../models/floor.model.js';

export const createParkingSlotSchema = Joi.object({
  floorId: Joi.number().integer().positive().required(),
  slotCode: Joi.string().trim().min(1).max(20).required(),
  vehicleType: Joi.string().valid(...VEHICLE_TYPES).required(),
  status: Joi.string().valid(...SLOT_STATUSES),
  note: Joi.string().trim().max(1000).allow('', null),
});

export const updateParkingSlotSchema = Joi.object({
  slotCode: Joi.string().trim().min(1).max(20),
  vehicleType: Joi.string().valid(...VEHICLE_TYPES),
  status: Joi.string().valid(...SLOT_STATUSES),
  note: Joi.string().trim().max(1000).allow('', null),
}).min(1);

export const updateSlotStatusSchema = Joi.object({
  status: Joi.string().valid(...SLOT_STATUSES).required(),
  note: Joi.string().trim().max(1000).allow('', null),
});
