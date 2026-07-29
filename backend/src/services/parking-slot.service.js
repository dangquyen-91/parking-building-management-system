import ParkingSlot from '../models/parking-slot.model.js';
import Floor from '../models/floor.model.js';
import Building from '../models/building.model.js';
import ParkingSession from '../models/parking-session.model.js';
import AppError from '../utils/appError.js';
import { SLOT_STATUSES } from '../models/parking-slot.model.js';
import { VEHICLE_TYPES } from '../models/floor.model.js';

const SLOT_SORT_FIELDS = ['slotCode', 'vehicleType', 'status', 'createdAt'];

const getAll = async ({ page = 1, limit = 10, floorId, buildingId, vehicleType, status, sortBy = 'slotCode', sortOrder = 'ASC' } = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (floorId) where.floorId = floorId;
  if (vehicleType) {
    if (!VEHICLE_TYPES.includes(vehicleType)) throw new AppError(`Invalid vehicleType. Must be one of: ${VEHICLE_TYPES.join(', ')}`, 400);
    where.vehicleType = vehicleType;
  }
  if (status) {
    if (!SLOT_STATUSES.includes(status)) throw new AppError(`Invalid status. Must be one of: ${SLOT_STATUSES.join(', ')}`, 400);
    where.status = status;
  }

  const floorWhere = {};
  if (buildingId) floorWhere.buildingId = buildingId;

  const orderField = SLOT_SORT_FIELDS.includes(sortBy) ? sortBy : 'slotCode';
  const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await ParkingSlot.findAndCountAll({
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
    slots: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum),
    },
  };
};

const getById = async (id) => {
  const slot = await ParkingSlot.findByPk(id, {
    include: [
      {
        model: Floor,
        as: 'floor',
        attributes: ['id', 'floorNumber', 'vehicleType', 'buildingId'],
        include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'address'] }],
      },
    ],
  });
  if (!slot) throw new AppError('Parking slot not found', 404);
  return slot;
};

const create = async (data) => {
  const floor = await Floor.findByPk(data.floorId, {
    include: [{ model: Building, as: 'building', attributes: ['id', 'isActive'] }],
  });
  if (!floor) throw new AppError('Floor not found', 404);
  if (!floor.isActive) throw new AppError('Floor is inactive', 400);
  if (!floor.building.isActive) throw new AppError('Building is inactive', 400);

  if (floor.vehicleType !== 'car') {
    throw new AppError('Parking slots can only be created on car floors. Use parking rows for motorcycle floors.', 400);
  }

  const existing = await ParkingSlot.findOne({ where: { floorId: data.floorId, slotCode: data.slotCode.trim() } });
  if (existing) throw new AppError(`Slot code "${data.slotCode}" already exists on this floor`, 409);

  const currentCount = await ParkingSlot.count({ where: { floorId: data.floorId } });
  if (currentCount >= floor.totalSlots) {
    throw new AppError(`Floor has reached its maximum capacity of ${floor.totalSlots} slots`, 409);
  }

  return ParkingSlot.create({ ...data, slotCode: data.slotCode.trim() });
};

const update = async (id, data) => {
  const slot = await ParkingSlot.findByPk(id, {
    include: [{ model: Floor, as: 'floor', attributes: ['id', 'vehicleType', 'totalSlots'] }],
  });
  if (!slot) throw new AppError('Parking slot not found', 404);

  if (data.vehicleType && data.vehicleType !== slot.floor.vehicleType) {
    throw new AppError(`This floor only accepts ${slot.floor.vehicleType} slots`, 400);
  }

  if (data.slotCode) {
    data.slotCode = data.slotCode.trim();
    const conflict = await ParkingSlot.findOne({ where: { floorId: slot.floorId, slotCode: data.slotCode } });
    if (conflict && conflict.id !== parseInt(id)) {
      throw new AppError(`Slot code "${data.slotCode}" already exists on this floor`, 409);
    }
  }

  await slot.update(data);
  return slot;
};

const updateStatus = async (id, status, note) => {
  const slot = await ParkingSlot.findByPk(id);
  if (!slot) throw new AppError('Parking slot not found', 404);

  const updateData = { status };
  if (note !== undefined) updateData.note = note;
  await slot.update(updateData);
  return slot;
};

const remove = async (id) => {
  const slot = await ParkingSlot.findByPk(id, {
    include: [{ model: ParkingSession, as: 'sessions', where: { status: 'active' }, required: false }],
  });
  if (!slot) throw new AppError('Parking slot not found', 404);
  if (slot.status === 'occupied' || (slot.sessions && slot.sessions.length > 0)) {
    throw new AppError('Không thể xóa vị trí đang có xe đỗ', 409);
  }
  await slot.destroy();
};

const bulkCreate = async ({ floorId, quantity, prefix = 'A', startFrom, slots }) => {
  const floor = await Floor.findByPk(floorId, {
    include: [{ model: Building, as: 'building', attributes: ['id', 'isActive'] }],
  });
  if (!floor) throw new AppError('Floor not found', 404);
  if (!floor.isActive) throw new AppError('Floor is inactive', 400);
  if (!floor.building.isActive) throw new AppError('Building is inactive', 400);

  if (floor.vehicleType !== 'car') {
    throw new AppError('Parking slots can only be created on car floors. Use parking rows for motorcycle floors.', 400);
  }

  if (quantity !== undefined) {
    const currentCount = await ParkingSlot.count({ where: { floorId } });
    if (currentCount + quantity > floor.totalSlots) {
      throw new AppError(
        `Floor capacity exceeded. Current: ${currentCount}, adding: ${quantity}, max: ${floor.totalSlots}`,
        409
      );
    }

    const from = startFrom !== undefined ? startFrom : currentCount + 1;
    const maxNum = from + quantity - 1;
    const padLen = Math.max(String(maxNum).length, 2);

    const generatedCodes = Array.from({ length: quantity }, (_, i) =>
      `${prefix.toUpperCase()}${String(from + i).padStart(padLen, '0')}`
    );
    const existingSlots = await ParkingSlot.findAll({ where: { floorId }, attributes: ['slotCode'] });
    const existingCodes = new Set(existingSlots.map((s) => s.slotCode));
    const conflicting = generatedCodes.find((c) => existingCodes.has(c));
    if (conflicting) throw new AppError(`Slot code "${conflicting}" already exists on this floor`, 409);

    slots = generatedCodes.map((slotCode) => ({ slotCode, vehicleType: floor.vehicleType }));
  } else {
    const codes = slots.map((s) => s.slotCode.trim());
    const duplicateInRequest = codes.find((c, i) => codes.indexOf(c) !== i);
    if (duplicateInRequest) throw new AppError(`Duplicate slotCode in request: "${duplicateInRequest}"`, 400);

    const currentCount = await ParkingSlot.count({ where: { floorId } });
    if (currentCount + slots.length > floor.totalSlots) {
      throw new AppError(
        `Floor capacity exceeded. Current: ${currentCount}, adding: ${slots.length}, max: ${floor.totalSlots}`,
        409
      );
    }

    const existingSlots = await ParkingSlot.findAll({ where: { floorId }, attributes: ['slotCode'] });
    const existingCodes = new Set(existingSlots.map((s) => s.slotCode));
    const conflicting = codes.find((c) => existingCodes.has(c));
    if (conflicting) throw new AppError(`Slot code "${conflicting}" already exists on this floor`, 409);
  }

  const transaction = await ParkingSlot.sequelize.transaction();
  try {
    const data = slots.map((s) => ({ ...s, slotCode: s.slotCode.trim(), floorId }));
    const created = await ParkingSlot.bulkCreate(data, { transaction });
    await transaction.commit();
    return created;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

export { getAll, getById, create, bulkCreate, update, updateStatus, remove };
