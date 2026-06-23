import * as vehicleService from '../services/vehicle.service.js';
import response from '../utils/response.js';

const getMine = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getMine(req.user.id);
    response.success(res, vehicles);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.create(req.user.id, req.body);
    response.success(res, vehicle, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.update(req.params.id, req.user.id, req.body);
    response.success(res, vehicle);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await vehicleService.remove(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export { getMine, create, update, remove };
