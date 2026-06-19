import Joi from 'joi';
import { PACKAGE_VEHICLE_TYPES } from '../models/parking-package.model.js';

export const createPackageSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  vehicleType: Joi.string().valid(...PACKAGE_VEHICLE_TYPES).required(),
  durationDays: Joi.number().integer().min(1).max(3650).required(),
  price: Joi.number().integer().min(0).max(1000000000).required(),
  description: Joi.string().trim().max(255).allow('', null),
  isActive: Joi.boolean(),
});

export const updatePackageSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  vehicleType: Joi.string().valid(...PACKAGE_VEHICLE_TYPES),
  durationDays: Joi.number().integer().min(1).max(3650),
  price: Joi.number().integer().min(0).max(1000000000),
  description: Joi.string().trim().max(255).allow('', null),
  isActive: Joi.boolean(),
}).min(1);
