import { Op } from 'sequelize';
import ParkingRow from '../models/parking-row.model.js';
import ParkingSession from '../models/parking-session.model.js';
import Floor from '../models/floor.model.js';
import Building from '../models/building.model.js';
import AppError from '../utils/appError.js';
import { ROW_STATUSES } from '../models/parking-row.model.js';

const ROW_SORT_FIELDS = ['rowCode', 'capacity', 'occupiedCount', 'status', 'createdAt'];

const getAll = async ({
  page = 1,
  limit = 10,
  floorId,
  buildingId,
  status,
  sortBy = 'rowCode',
  sortOrder = 'ASC',
} = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (floorId) where.floorId = floorId;
  if (status) {
    if (!ROW_STATUSES.includes(status))
      throw new AppError(`Invalid status. Must be one of: ${ROW_STATUSES.join(', ')}`, 400);
    where.status = status;
  }

  const floorWhere = {};
  if (buildingId) floorWhere.buildingId = buildingId;

  const orderField = ROW_SORT_FIELDS.includes(sortBy) ? sortBy : 'rowCode';
  const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await ParkingRow.findAndCountAll({
    where,
    include: [
      {
        model: Floor,
        as: 'floor',
        where: Object.keys(floorWhere).length ? floorWhere : undefined,
        attributes: ['id', 'floorNumber', 'vehicleType', 'buildingId'],
        include: [{ model: Building, as: 'building', attributes: ['id', 'name'] }],
      },
    ],
    order: [[orderField, orderDir]],
    limit: limitNum,
    offset,
  });

  return {
    rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum),
    },
  };
};

const getById = async (id) => {
  const row = await ParkingRow.findByPk(id, {
    include: [
      {
        model: Floor,
        as: 'floor',
        attributes: ['id', 'floorNumber', 'vehicleType', 'buildingId', 'totalSlots'],
        include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'address'] }],
      },
    ],
  });
  if (!row) throw new AppError('Parking row not found', 404);
  return row;
};

const create = async ({ floorId, rowCode, capacity, note }) => {
  const floor = await Floor.findByPk(floorId, {
    include: [{ model: Building, as: 'building', attributes: ['id', 'isActive'] }],
  });
  if (!floor) throw new AppError('Floor not found', 404);
  if (!floor.isActive) throw new AppError('Floor is inactive', 400);
  if (!floor.building.isActive) throw new AppError('Building is inactive', 400);
  if (floor.vehicleType !== 'motorcycle') {
    throw new AppError('Parking rows can only be created on motorcycle floors', 400);
  }

  const existing = await ParkingRow.findOne({
    where: { floorId, rowCode: rowCode.trim() },
  });
  if (existing) throw new AppError(`Row code "${rowCode}" already exists on this floor`, 409);

  const usedCapacity = (await ParkingRow.sum('capacity', { where: { floorId } })) || 0;
  if (usedCapacity + capacity > floor.totalSlots) {
    throw new AppError(
      `Floor capacity exceeded. Used: ${usedCapacity}, adding: ${capacity}, max: ${floor.totalSlots}`,
      409
    );
  }

  return ParkingRow.create({
    floorId,
    rowCode: rowCode.trim(),
    capacity,
    occupiedCount: 0,
    status: 'available',
    note: note || null,
  });
};

const update = async (id, { rowCode, capacity, note }) => {
  const row = await ParkingRow.findByPk(id);
  if (!row) throw new AppError('Parking row not found', 404);

  const data = {};
  if (rowCode !== undefined) {
    data.rowCode = rowCode.trim();
    const conflict = await ParkingRow.findOne({
      where: { floorId: row.floorId, rowCode: data.rowCode },
    });
    if (conflict && conflict.id !== parseInt(id)) {
      throw new AppError(`Row code "${data.rowCode}" already exists on this floor`, 409);
    }
  }
  if (capacity !== undefined) {
    if (capacity < row.occupiedCount) {
      throw new AppError(
        `Cannot reduce capacity to ${capacity}: ${row.occupiedCount} motorcycles currently parked`,
        409
      );
    }

    const floor = await Floor.findByPk(row.floorId);
    const otherCapacity =
      (await ParkingRow.sum('capacity', {
        where: { floorId: row.floorId, id: { [Op.ne]: parseInt(id) } },
      })) || 0;
    if (otherCapacity + capacity > floor.totalSlots) {
      throw new AppError(
        `Floor capacity exceeded. Other rows: ${otherCapacity}, updating to: ${capacity}, max: ${floor.totalSlots}`,
        409
      );
    }

    data.capacity = capacity;
    if (data.capacity <= row.occupiedCount) data.status = 'full';
    else if (row.status === 'full') data.status = 'available';
  }
  if (note !== undefined) data.note = note;

  await row.update(data);
  return row;
};

const updateStatus = async (id, status, note) => {
  if (!ROW_STATUSES.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${ROW_STATUSES.join(', ')}`, 400);
  }
  const row = await ParkingRow.findByPk(id);
  if (!row) throw new AppError('Parking row not found', 404);

  const updateData = { status };
  if (note !== undefined) updateData.note = note;
  await row.update(updateData);
  return row;
};

const remove = async (id) => {
  const row = await ParkingRow.findByPk(id, {
    include: [
      {
        model: ParkingSession,
        as: 'sessions',
        where: { status: 'active' },
        required: false,
      },
    ],
  });
  if (!row) throw new AppError('Parking row not found', 404);
  if (row.sessions && row.sessions.length > 0) {
    throw new AppError('Cannot delete row with an active parking session', 409);
  }
  await row.destroy();
};

export { getAll, getById, create, update, updateStatus, remove };
