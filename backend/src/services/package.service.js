import ParkingPackage from '../models/parking-package.model.js';
import AppError from '../utils/appError.js';

export const getAll = async ({ vehicleType, isActive } = {}) => {
  const where = {};
  if (vehicleType) where.vehicleType = vehicleType;
  if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

  return ParkingPackage.findAll({ where, order: [['vehicleType', 'ASC'], ['durationDays', 'ASC']] });
};

export const getById = async (id) => {
  const pkg = await ParkingPackage.findByPk(id);
  if (!pkg) throw new AppError('Package not found', 404);
  return pkg;
};

export const create = async ({ name, vehicleType, durationDays, price, description, isActive }) => {
  return ParkingPackage.create({
    name: name.trim(),
    vehicleType,
    durationDays,
    price,
    description: description?.trim() || null,
    isActive: isActive ?? true,
  });
};

export const update = async (id, data) => {
  const pkg = await ParkingPackage.findByPk(id);
  if (!pkg) throw new AppError('Package not found', 404);

  const allowed = ['name', 'vehicleType', 'durationDays', 'price', 'description', 'isActive'];
  const patch = {};
  for (const k of allowed) if (data[k] !== undefined) patch[k] = data[k];

  await pkg.update(patch);
  return pkg;
};

export const remove = async (id) => {
  const pkg = await ParkingPackage.findByPk(id);
  if (!pkg) throw new AppError('Package not found', 404);
  await pkg.update({ isActive: false });
};
