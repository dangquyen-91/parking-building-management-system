import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as buildingController from '../controllers/building.controller.js';
import { createBuildingSchema, updateBuildingSchema } from '../validations/building.validation.js';

const router = Router();

router.use(authenticate);

// All authenticated users can view buildings
router.get('/', buildingController.getAll);
router.get('/:id', buildingController.getById);

// Admin + Manager: create and update
router.post('/', authorize('admin', 'manager'), validate(createBuildingSchema), buildingController.create);
router.patch('/:id', authorize('admin', 'manager'), validate(updateBuildingSchema), buildingController.update);

// Admin only: delete
router.delete('/:id', authorize('admin'), buildingController.remove);

export default router;
