import * as parkingRowService from '../services/parking-row.service.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const { page, limit, floorId, buildingId, status, sortBy, sortOrder } = req.query;
    const result = await parkingRowService.getAll({ page, limit, floorId, buildingId, status, sortBy, sortOrder });
    response.paginated(res, result.rows, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const row = await parkingRowService.getById(req.params.id);
    response.success(res, row);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const row = await parkingRowService.create(req.body);
    response.success(res, row, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const row = await parkingRowService.update(req.params.id, req.body);
    response.success(res, row);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const row = await parkingRowService.updateStatus(req.params.id, status, note);
    response.success(res, row);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await parkingRowService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export { getAll, getById, create, update, updateStatus, remove };
