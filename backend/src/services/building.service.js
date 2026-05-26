import { Op } from 'sequelize';
import Building from '../models/building.model.js';
import Floor from '../models/floor.model.js';
import AppError from '../utils/appError.js';

const BUILDING_SORT_FIELDS = ['name', 'address', 'createdAt'];

const getAll = async ({ page = 1, limit = 10, isActive, search, sortBy = 'createdAt', sortOrder = 'DESC' } = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { address: { [Op.like]: `%${search}%` } },
    ];
  }

  const orderField = BUILDING_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await Building.findAndCountAll({
    where,
    order: [[orderField, orderDir]],
    limit: limitNum,
    offset,
  });

  return {
    buildings: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum),
    },
  };
};

const getById = async (id) => {
  const building = await Building.findByPk(id, {
    include: [{ model: Floor, as: 'floors' }],
  });
  if (!building) throw new AppError('Building not found', 404);
  return building;
};

const create = async (data) => {
  const existing = await Building.findOne({ where: { name: data.name.trim() } });
  if (existing) throw new AppError('Building name already exists', 409);

  return Building.create({
    name: data.name.trim(),
    address: data.address.trim(),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
  });
};

const update = async (id, data) => {
  const building = await Building.findByPk(id);
  if (!building) throw new AppError('Building not found', 404);

  if (data.name) {
    const conflict = await Building.findOne({ where: { name: data.name.trim() } });
    if (conflict && conflict.id !== parseInt(id)) {
      throw new AppError('Building name already in use', 409);
    }
    data.name = data.name.trim();
  }

  await building.update(data);
  return building;
};

const remove = async (id) => {
  const building = await Building.findByPk(id, {
    include: [{ model: Floor, as: 'floors' }],
  });
  if (!building) throw new AppError('Building not found', 404);
  if (building.floors && building.floors.length > 0) {
    throw new AppError('Cannot delete building with existing floors', 409);
  }
  await building.destroy();
};

export { getAll, getById, create, update, remove };
