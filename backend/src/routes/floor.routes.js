import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as floorController from '../controllers/floor.controller.js';
import { createFloorSchema, updateFloorSchema } from '../validations/floor.validation.js';

const router = Router();

router.use(authenticate);

// All authenticated users can view floors
router.get('/', floorController.getAll);
router.get('/:id', floorController.getById);

// Admin + Manager: create and update
router.post('/', authorize('admin', 'manager'), validate(createFloorSchema), floorController.create);
router.patch('/:id', authorize('admin', 'manager'), validate(updateFloorSchema), floorController.update);

// Admin only: delete
router.delete('/:id', authorize('admin'), floorController.remove);

export default router;
