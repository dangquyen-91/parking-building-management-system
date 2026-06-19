import * as buildingService from '../services/building.service.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const { page, limit, isActive, search, sortBy, sortOrder } = req.query;
    const result = await buildingService.getAll({ page, limit, isActive, search, sortBy, sortOrder });
    response.paginated(res, result.buildings, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const building = await buildingService.getById(req.params.id);
    response.success(res, building);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const building = await buildingService.create(req.body);
    response.success(res, building, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const building = await buildingService.update(req.params.id, req.body);
    response.success(res, building);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await buildingService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export { getAll, getById, create, update, remove };
