import rateLimit from 'express-rate-limit';

const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
};

/**
 * Global API limiter — applies to all /api/v1/*. Generous to allow normal app
 * traffic; tighter limits below for specific high-risk endpoints.
 */
export const apiLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

/**
 * Login limiter — brute-force protection. Only failed logins count toward the
 * cap (skipSuccessfulRequests), so a user with correct credentials can sign in
 * repeatedly without exhausting quota.
 */
export const loginLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 15,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 15 phút.' },
});

/**
 * Register limiter — anti-spam. Tighter window because account creation is
 * rarely needed in bursts.
 */
export const registerLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Quá nhiều lần đăng ký. Vui lòng thử lại sau 1 giờ.' },
});

/**
 * Refresh limiter — legitimate usage may refresh tokens frequently (every 15
 * min for a long-running tab). Generous limit, only fails count.
 */
export const refreshLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 60,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Refresh token bị giới hạn. Vui lòng đăng nhập lại.' },
});

/**
 * Legacy authLimiter — kept for backwards compatibility with existing mounts
 * that import { authLimiter }. Use the per-endpoint limiters above for new code.
 */
export const authLimiter = loginLimiter;
