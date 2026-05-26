import Floor from '../models/floor.model.js';
import Building from '../models/building.model.js';
import ParkingSlot from '../models/parking-slot.model.js';
import ParkingRow from '../models/parking-row.model.js';
import AppError from '../utils/appError.js';
import { VEHICLE_TYPES, FLOOR_TYPES } from '../models/floor.model.js';

const FLOOR_SORT_FIELDS = ['floorNumber', 'vehicleType', 'floorType', 'totalSlots', 'createdAt'];

const getAll = async ({ page = 1, limit = 10, buildingId, vehicleType, floorType, isActive, sortBy = 'floorNumber', sortOrder = 'ASC' } = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (buildingId) where.buildingId = buildingId;
  if (vehicleType) {
    if (!VEHICLE_TYPES.includes(vehicleType)) throw new AppError(`Invalid vehicleType. Must be one of: ${VEHICLE_TYPES.join(', ')}`, 400);
    where.vehicleType = vehicleType;
  }
  if (floorType) {
    if (!FLOOR_TYPES.includes(floorType)) throw new AppError(`Invalid floorType. Must be one of: ${FLOOR_TYPES.join(', ')}`, 400);
    where.floorType = floorType;
  }
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }

  const orderField = FLOOR_SORT_FIELDS.includes(sortBy) ? sortBy : 'floorNumber';
  const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await Floor.findAndCountAll({
    where,
    include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'address'] }],
    order: [[orderField, orderDir]],
    limit: limitNum,
    offset,
  });

  return {
    floors: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum),
    },
  };
};

const getById = async (id) => {
  const floor = await Floor.findByPk(id, {
    include: [
      { model: Building, as: 'building', attributes: ['id', 'name', 'address'] },
      { model: ParkingSlot, as: 'slots' },      // car floors
      { model: ParkingRow,  as: 'rows'  },      // motorcycle floors
    ],
  });
  if (!floor) throw new AppError('Floor not found', 404);
  return floor;
};

const create = async (data) => {
  const building = await Building.findByPk(data.buildingId);
  if (!building) throw new AppError('Building not found', 404);
  if (!building.isActive) throw new AppError('Building is inactive', 400);

  const existing = await Floor.findOne({ where: { buildingId: data.buildingId, floorNumber: data.floorNumber } });
  if (existing) throw new AppError(`Floor ${data.floorNumber} already exists in this building`, 409);

  return Floor.create(data);
};

const update = async (id, data) => {
  const floor = await Floor.findByPk(id);
  if (!floor) throw new AppError('Floor not found', 404);

  if (data.floorNumber !== undefined) {
    const conflict = await Floor.findOne({ where: { buildingId: floor.buildingId, floorNumber: data.floorNumber } });
    if (conflict && conflict.id !== parseInt(id)) {
      throw new AppError(`Floor ${data.floorNumber} already exists in this building`, 409);
    }
  }

  await floor.update(data);
  return floor;
};

const remove = async (id) => {
  const floor = await Floor.findByPk(id, {
    include: [
      { model: ParkingSlot, as: 'slots' },
      { model: ParkingRow,  as: 'rows'  },
    ],
  });
  if (!floor) throw new AppError('Floor not found', 404);
  if (floor.slots && floor.slots.length > 0) {
    throw new AppError('Cannot delete floor with existing parking slots', 409);
  }
  if (floor.rows && floor.rows.length > 0) {
    throw new AppError('Cannot delete floor with existing parking rows', 409);
  }
  await floor.destroy();
};

export { getAll, getById, create, update, remove };
