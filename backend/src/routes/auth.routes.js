import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import * as authController from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { changePasswordSchema } from '../validations/auth.validation.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
