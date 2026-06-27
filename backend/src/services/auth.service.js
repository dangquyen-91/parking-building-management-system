import crypto from 'crypto';
import User from '../models/user.model.js';
import Role from '../models/role.model.js';
import AppError from '../utils/appError.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateTokens, verifyRefresh } from '../utils/jwt.js';
import { sendVerificationEmail } from './email.service.js';

const DEFAULT_ROLE_NAME = 'user';

const getRoleByName = async (name) => {
  const role = await Role.findOne({ where: { name } });
  if (!role) throw new AppError(`Role "${name}" not found in roles table`, 500);
  return role;
};

const loadUserWithRole = (where) =>
  User.findOne({
    where,
    include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }],
  });

const register = async ({ fullName, email, password, phone }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) throw new AppError('Email already exists', 409);

  const defaultRole = await getRoleByName(DEFAULT_ROLE_NAME);
  const hashed = await hashPassword(password);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

  await User.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password: hashed,
    roleId: defaultRole.id,
    ...(phone && { phone: phone.trim() }),
    isEmailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpires: tokenExpires,
  });

  await sendVerificationEmail({ to: normalizedEmail, toName: fullName.trim(), token: verificationToken });

  return { message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.' };
};

const login = async ({ email, password }) => {
  const user = await loadUserWithRole({ email: email.toLowerCase().trim(), isActive: true });
  if (!user) throw new AppError('Invalid credentials', 401);

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  if (user.isEmailVerified === false) {
    throw new AppError('Vui lòng xác minh email trước khi đăng nhập. Kiểm tra hộp thư của bạn.', 403);
  }

  const { accessToken, refreshToken } = generateTokens({ id: user.id, role: user.role.name });
  await user.update({ refreshToken });

  return { accessToken, refreshToken };
};

const refresh = async (token) => {
  if (!token) throw new AppError('No refresh token', 401);

  const decoded = verifyRefresh(token);

  const user = await loadUserWithRole({ id: decoded.id, refreshToken: token });
  if (!user) throw new AppError('Refresh token revoked', 401);

  const { accessToken, refreshToken } = generateTokens({ id: user.id, role: user.role.name });
  await user.update({ refreshToken });

  return { accessToken, refreshToken };
};

const logout = async (userId) => {
  await User.update({ refreshToken: null }, { where: { id: userId } });
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await loadUserWithRole({ id: userId });
  if (!user || !user.isActive) throw new AppError('User not found', 404);

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);

  const isSamePassword = await comparePassword(newPassword, user.password);
  if (isSamePassword) throw new AppError('New password must be different from current password', 400);

  const hashed = await hashPassword(newPassword);
  const { accessToken, refreshToken } = generateTokens({ id: user.id, role: user.role.name });

  await user.update({ password: hashed, refreshToken });

  return { accessToken, refreshToken };
};

const verifyEmail = async (token) => {
  if (!token) throw new AppError('Token không hợp lệ', 400);

  const user = await User.findOne({ where: { emailVerificationToken: token } });
  if (!user) throw new AppError('Token không hợp lệ hoặc đã được sử dụng', 400);

  if (user.isEmailVerified) throw new AppError('Email đã được xác minh trước đó', 400);

  if (new Date() > new Date(user.emailVerificationTokenExpires)) {
    throw new AppError('Token đã hết hạn. Vui lòng yêu cầu gửi lại email xác minh.', 400);
  }

  await user.update({
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpires: null,
  });

  return { message: 'Xác minh email thành công. Bạn có thể đăng nhập ngay bây giờ.' };
};

const resendVerification = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ where: { email: normalizedEmail, isActive: true } });

  // Trả về thông báo chung để tránh lộ thông tin tài khoản
  if (!user || user.isEmailVerified) {
    return { message: 'Nếu email tồn tại và chưa xác minh, chúng tôi đã gửi lại email xác minh.' };
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await user.update({
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpires: tokenExpires,
  });

  await sendVerificationEmail({ to: normalizedEmail, toName: user.fullName, token: verificationToken });

  return { message: 'Nếu email tồn tại và chưa xác minh, chúng tôi đã gửi lại email xác minh.' };
};

export { register, login, refresh, logout, changePassword, verifyEmail, resendVerification };
