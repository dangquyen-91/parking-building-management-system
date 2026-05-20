import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as authController from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, refreshSchema } from '../validations/auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);

export default router;
