import Joi from 'joi';
import { SLOT_STATUSES } from '../models/parking-slot.model.js';

// Slots chỉ dành cho xe hơi. Xe máy dùng ParkingRow.
const SLOT_VEHICLE_TYPE = 'car';

export const createParkingSlotSchema = Joi.object({
  floorId: Joi.number().integer().positive().required(),
  slotCode: Joi.string().trim().min(1).max(20).required(),
  vehicleType: Joi.string().valid(SLOT_VEHICLE_TYPE).required().messages({
    'any.only': 'Parking slots only support car. Use parking rows for motorcycle.',
  }),
  status: Joi.string().valid(...SLOT_STATUSES),
  note: Joi.string().trim().max(1000).allow('', null),
});

export const updateParkingSlotSchema = Joi.object({
  slotCode: Joi.string().trim().min(1).max(20),
  vehicleType: Joi.string().valid(SLOT_VEHICLE_TYPE).messages({
    'any.only': 'Parking slots only support car. Use parking rows for motorcycle.',
  }),
  status: Joi.string().valid(...SLOT_STATUSES),
  note: Joi.string().trim().max(1000).allow('', null),
}).min(1);

export const updateSlotStatusSchema = Joi.object({
  status: Joi.string().valid(...SLOT_STATUSES).required(),
  note: Joi.string().trim().max(1000).allow('', null),
});

const bulkByQuantitySchema = Joi.object({
  floorId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(200).required(),
  prefix: Joi.string().trim().uppercase().max(5).default('A'),
  startFrom: Joi.number().integer().min(1),
});

const bulkBySlotsSchema = Joi.object({
  floorId: Joi.number().integer().positive().required(),
  slots: Joi.array()
    .items(
      Joi.object({
        slotCode: Joi.string().trim().min(1).max(20).required(),
        vehicleType: Joi.string().valid(SLOT_VEHICLE_TYPE).required().messages({
          'any.only': 'Parking slots only support car. Use parking rows for motorcycle.',
        }),
        status: Joi.string().valid(...SLOT_STATUSES),
        note: Joi.string().trim().max(1000).allow('', null),
      })
    )
    .min(1)
    .max(200)
    .required(),
});

export const bulkCreateParkingSlotSchema = Joi.alternatives()
  .try(bulkByQuantitySchema, bulkBySlotsSchema)
  .messages({ 'alternatives.match': 'Body must have either "quantity" (auto-generate) or "slots" (explicit list)' });
