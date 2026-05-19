import jwt from 'jsonwebtoken';
import AppError from './appError.js';

export const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });

export const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

export const verifyAccess = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
};

export const verifyRefresh = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
};

export const generateTokens = (payload) => ({
  accessToken: signAccess(payload),
  refreshToken: signRefresh(payload),
});
