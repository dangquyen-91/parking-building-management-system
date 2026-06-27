import rateLimit from 'express-rate-limit';

const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
};

export const apiLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

export const loginLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 15,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút.' },
});

export const registerLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Quá nhiều lần đăng ký. Vui lòng thử lại sau 1 giờ.' },
});

export const refreshLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 60,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Refresh token bị giới hạn. Vui lòng đăng nhập lại.' },
});

export const resendVerificationLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Quá nhiều yêu cầu gửi lại email. Vui lòng thử lại sau 1 giờ.' },
});

export const authLimiter = loginLimiter;
