import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), userController.getAll);
router.get('/:id', authenticate, userController.getById);
router.put('/:id', authenticate, userController.update);
router.delete('/:id', authenticate, authorize('admin'), userController.remove);

export default router;
