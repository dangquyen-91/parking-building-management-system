import { Op } from 'sequelize';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';
import { ROLES, USER_SORT_FIELDS } from '../constants/roles.js';

const EXCLUDE = ['password', 'refreshToken'];

const getAll = async ({ page = 1, limit = 10, role, isActive, search, sortBy = 'createdAt', sortOrder = 'DESC' } = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (role) {
    if (!ROLES.includes(role)) throw new AppError(`Invalid role filter`, 400);
    where.role = role;
  }
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }
  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const orderField = USER_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: EXCLUDE },
    order: [[orderField, orderDir]],
    limit: limitNum,
    offset,
  });

  return {
    users: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum),
    },
  };
};

const getById = async (id, requesterId, requesterRole) => {
  const canViewAll = requesterRole === 'admin' || requesterRole === 'manager';
  if (!canViewAll && parseInt(id) !== requesterId) {
    throw new AppError('Access denied', 403);
  }
  const user = await User.findByPk(id, { attributes: { exclude: EXCLUDE } });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const update = async (id, data, requesterId, requesterRole) => {
  if (requesterRole !== 'admin' && parseInt(id) !== requesterId) {
    throw new AppError('Access denied', 403);
  }
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);

  const { password, refreshToken, role, isActive, ...safeData } = data;

  if (safeData.email) {
    safeData.email = safeData.email.toLowerCase().trim();
    const conflict = await User.findOne({ where: { email: safeData.email } });
    if (conflict && conflict.id !== parseInt(id)) {
      throw new AppError('Email already in use', 409);
    }
  }

  await user.update(safeData);

  const { password: _p, refreshToken: _r, ...updated } = user.toJSON();
  return updated;
};

const updateMe = async (id, data) => {
  const user = await User.findByPk(id, { attributes: { exclude: EXCLUDE } });
  if (!user) throw new AppError('User not found', 404);
  const { fullName, phone } = data;
  const safeData = {};
  if (fullName !== undefined) safeData.fullName = fullName;
  if (phone !== undefined) safeData.phone = phone;
  await user.update(safeData);
  await user.reload();
  return user;
};

const updateStatus = async (id, isActive) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);
  await user.update({ isActive });
  const { password, refreshToken, ...updated } = user.toJSON();
  return updated;
};

const updateRole = async (id, role) => {
  if (!ROLES.includes(role)) {
    throw new AppError(`Invalid role. Must be one of: ${ROLES.join(', ')}`, 400);
  }
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);
  await user.update({ role });
  const { password, refreshToken, ...updated } = user.toJSON();
  return updated;
};

const remove = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);
  await user.destroy();
};

export { getAll, getById, updateMe, update, updateStatus, updateRole, remove };
