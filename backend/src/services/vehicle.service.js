import Vehicle from '../models/vehicle.model.js';
import AppError from '../utils/appError.js';

const normalizePlate = (plate) => plate.toUpperCase().replace(/\s/g, '');

const assertPlateFree = async (plate, excludeId) => {
  const existing = await Vehicle.findOne({ where: { licensePlate: plate } });
  if (existing && existing.id !== excludeId) {
    throw new AppError(`Biển số ${plate} đã được đăng ký trong hệ thống`, 409);
  }
};

const findOwned = async (id, userId) => {
  const vehicle = await Vehicle.findByPk(id);
  if (!vehicle) throw new AppError('Vehicle not found', 404);
  if (vehicle.userId !== userId) throw new AppError('Access denied', 403);
  return vehicle;
};

export const getMine = async (userId) =>
  Vehicle.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });

export const create = async (userId, { licensePlate, vehicleType, nickname }) => {
  const plate = normalizePlate(licensePlate);
  await assertPlateFree(plate, null);

  try {
    return await Vehicle.create({
      userId,
      licensePlate: plate,
      vehicleType,
      nickname: nickname?.trim() || null,
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      throw new AppError(`Biển số ${plate} đã được đăng ký trong hệ thống`, 409);
    }
    throw err;
  }
};

export const update = async (id, userId, data) => {
  const vehicle = await findOwned(id, userId);

  const patch = {};
  if (data.vehicleType !== undefined) patch.vehicleType = data.vehicleType;
  if (data.nickname !== undefined) patch.nickname = data.nickname.trim() || null;
  if (data.licensePlate !== undefined) {
    const plate = normalizePlate(data.licensePlate);
    await assertPlateFree(plate, vehicle.id);
    patch.licensePlate = plate;
  }

  try {
    await vehicle.update(patch);
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      throw new AppError(`Biển số ${patch.licensePlate} đã được đăng ký trong hệ thống`, 409);
    }
    throw err;
  }
  return vehicle;
};

export const remove = async (id, userId) => {
  const vehicle = await findOwned(id, userId);
  await vehicle.destroy();
};
