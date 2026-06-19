import Joi from 'joi';

export const createBuildingSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  address: Joi.string().trim().min(5).max(255).required(),
  description: Joi.string().trim().max(1000).allow('', null),
  isActive: Joi.boolean(),
});

export const updateBuildingSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  address: Joi.string().trim().min(5).max(255),
  description: Joi.string().trim().max(1000).allow('', null),
  isActive: Joi.boolean(),
}).min(1);
