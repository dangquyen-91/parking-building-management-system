import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as userController from '../controllers/user.controller.js';
import validate from '../middlewares/validate.middleware.js';
import {
  updateMeSchema,
  updateUserSchema,
  changeRoleSchema,
  updateStatusSchema,
} from '../validations/user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateMeSchema), userController.updateMe);

router.get('/', authorize('admin', 'manager'), userController.getAll);
router.get('/:id', authorize('admin', 'manager'), userController.getById);

router.patch('/:id', authorize('admin'), validate(updateUserSchema), userController.update);
router.patch('/:id/role', authorize('admin'), validate(changeRoleSchema), userController.updateRole);
router.patch('/:id/status', authorize('admin'), validate(updateStatusSchema), userController.updateStatus);
router.delete('/:id', authorize('admin'), userController.remove);

export default router;
