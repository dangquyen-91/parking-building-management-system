import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as authController from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { changePasswordSchema, registerSchema, resendVerificationSchema } from '../validations/auth.validation.js';
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
  resendVerificationLimiter,
} from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

// Email verification
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, validate(resendVerificationSchema), authController.resendVerification);

export default router;
