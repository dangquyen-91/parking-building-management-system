import * as parkingSlotService from '../services/parking-slot.service.js';
import response from '../utils/response.js';

const getAll = async (req, res, next) => {
  try {
    const { page, limit, floorId, buildingId, vehicleType, status, sortBy, sortOrder } = req.query;
    const result = await parkingSlotService.getAll({ page, limit, floorId, buildingId, vehicleType, status, sortBy, sortOrder });
    response.paginated(res, result.slots, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const slot = await parkingSlotService.getById(req.params.id);
    response.success(res, slot);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const slot = await parkingSlotService.create(req.body);
    response.success(res, slot, 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const slot = await parkingSlotService.update(req.params.id, req.body);
    response.success(res, slot);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const slot = await parkingSlotService.updateStatus(req.params.id, status, note);
    response.success(res, slot);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await parkingSlotService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const bulkCreate = async (req, res, next) => {
  try {
    const slots = await parkingSlotService.bulkCreate(req.body);
    response.success(res, { slots, count: slots.length }, 201);
  } catch (err) {
    next(err);
  }
};

export { getAll, getById, create, bulkCreate, update, updateStatus, remove };
