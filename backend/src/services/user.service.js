import { Op } from 'sequelize';
import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import AppError from '../utils/appError.js';
import { USER_SORT_FIELDS } from '../constants/roles.js';

const EXCLUDE = ['password', 'refreshToken'];

const ROLE_INCLUDE = { model: Role, as: 'role', attributes: ['id', 'name', 'description'] };

const findRoleByName = async (name) => {
  const role = await Role.findOne({ where: { name } });
  if (!role) throw new AppError(`Role "${name}" not found`, 400);
  return role;
};

const flattenRole = (user) => {
  if (!user) return user;
  const json = user.toJSON ? user.toJSON() : user;
  if (json.role && typeof json.role === 'object') {
    return { ...json, role: json.role.name };
  }
  return json;
};

const getAll = async ({ page = 1, limit = 10, role, isActive, search, sortBy = 'createdAt', sortOrder = 'DESC' } = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }
  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const roleWhere = role ? { name: role } : undefined;

  const orderField = USER_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: EXCLUDE },
    include: [{ ...ROLE_INCLUDE, where: roleWhere, required: !!roleWhere }],
    order: [[orderField, orderDir]],
    limit: limitNum,
    offset,
  });

  return {
    users: rows.map(flattenRole),
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
  const user = await User.findByPk(id, {
    attributes: { exclude: EXCLUDE },
    include: [ROLE_INCLUDE],
  });
  if (!user) throw new AppError('User not found', 404);
  return flattenRole(user);
};

const update = async (id, data, requesterId, requesterRole) => {
  if (requesterRole !== 'admin' && parseInt(id) !== requesterId) {
    throw new AppError('Access denied', 403);
  }
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);

  const { password, refreshToken, role, roleId, isActive, ...safeData } = data;

  if (safeData.email) {
    safeData.email = safeData.email.toLowerCase().trim();
    const conflict = await User.findOne({ where: { email: safeData.email } });
    if (conflict && conflict.id !== parseInt(id)) {
      throw new AppError('Email already in use', 409);
    }
  }

  await user.update(safeData);
  await user.reload({ attributes: { exclude: EXCLUDE }, include: [ROLE_INCLUDE] });
  return flattenRole(user);
};

const updateMe = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);
  const { fullName, phone } = data;
  const safeData = {};
  if (fullName !== undefined) safeData.fullName = fullName;
  if (phone !== undefined) safeData.phone = phone;
  await user.update(safeData);
  await user.reload({ attributes: { exclude: EXCLUDE }, include: [ROLE_INCLUDE] });
  return flattenRole(user);
};

const updateStatus = async (id, isActive) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);
  await user.update({ isActive });
  await user.reload({ attributes: { exclude: EXCLUDE }, include: [ROLE_INCLUDE] });
  return flattenRole(user);
};

const updateRole = async (id, role) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);
  const target = await findRoleByName(role);
  await user.update({ roleId: target.id });
  await user.reload({ attributes: { exclude: EXCLUDE }, include: [ROLE_INCLUDE] });
  return flattenRole(user);
};

const remove = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);
  await user.destroy();
};

export { getAll, getById, updateMe, update, updateStatus, updateRole, remove };
