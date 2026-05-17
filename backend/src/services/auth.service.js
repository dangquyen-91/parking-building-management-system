import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};

const register = async ({ fullName, email, password, role }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('Email already exists', 409);

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ fullName, email, password: hashed, role });
  const { password: _, refreshToken: __, ...data } = user.toJSON();
  return data;
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email, isActive: true } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  const { accessToken, refreshToken } = generateTokens({ id: user.id, role: user.role });
  await user.update({ refreshToken });

  return { accessToken, refreshToken };
};

const refresh = async (token) => {
  if (!token) throw new AppError('No refresh token', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

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
