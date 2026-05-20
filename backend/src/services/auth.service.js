import User from '../models/user.model.js';
import AppError from '../utils/appError.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateTokens, verifyRefresh } from '../utils/jwt.js';

const register = async ({ fullName, email, password, phone }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) throw new AppError('Email already exists', 409);

  const hashed = await hashPassword(password);
  const user = await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashed,
    ...(phone && { phone: phone.trim() }),
  });
  const { password: _, refreshToken: __, ...data } = user.toJSON();
  return data;
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim(), isActive: true } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  const { accessToken, refreshToken } = generateTokens({ id: user.id, role: user.role });
  await user.update({ refreshToken });

  return { accessToken, refreshToken };
};

const refresh = async (token) => {
  if (!token) throw new AppError('No refresh token', 401);

  const decoded = verifyRefresh(token);

  const user = await User.findOne({ where: { id: decoded.id, refreshToken: token } });
  if (!user) throw new AppError('Refresh token revoked', 401);

  const { accessToken, refreshToken } = generateTokens({ id: user.id, role: user.role });
  await user.update({ refreshToken });

  return { accessToken, refreshToken };
};

const logout = async (userId) => {
  await User.update({ refreshToken: null }, { where: { id: userId } });
};

export { register, login, refresh, logout };
