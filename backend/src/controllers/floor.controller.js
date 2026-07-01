import * as floorService from '../services/floor.service.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const { page, limit, buildingId, vehicleType, floorType, isActive, sortBy, sortOrder } = req.query;
    const result = await floorService.getAll({ page, limit, buildingId, vehicleType, floorType, isActive, sortBy, sortOrder });
    response.paginated(res, result.floors, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const floor = await floorService.getById(req.params.id);
    response.success(res, floor);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const floor = await floorService.create(req.body);
    response.success(res, floor, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const floor = await floorService.update(req.params.id, req.body);
    response.success(res, floor);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await floorService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export { getAll, getById, create, update, remove };
