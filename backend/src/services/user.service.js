import User from '../models/user.model.js';
import AppError from '../utils/appError.js';

const EXCLUDE = ['password', 'refreshToken'];

const getAll = async () => {
  return User.findAll({ attributes: { exclude: EXCLUDE } });
};

const getById = async (id) => {
  const user = await User.findByPk(id, { attributes: { exclude: EXCLUDE } });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const update = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);

  const { password, refreshToken, role, ...safeData } = data;
  await user.update(safeData);

  const { password: _, refreshToken: __, ...updated } = user.toJSON();
  return updated;
};

const remove = async (id) => {
  const user = await User.findByPk(id);
  if (!user) throw new AppError('User not found', 404);
  await user.destroy();
};

export { getAll, getById, update, remove };
