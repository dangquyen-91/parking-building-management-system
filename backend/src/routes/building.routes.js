import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as buildingController from '../controllers/building.controller.js';
import { createBuildingSchema, updateBuildingSchema } from '../validations/building.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', buildingController.getAll);
router.get('/:id', buildingController.getById);

router.post('/', authorize('admin', 'manager'), validate(createBuildingSchema), buildingController.create);
router.patch('/:id', authorize('admin', 'manager'), validate(updateBuildingSchema), buildingController.update);

router.delete('/:id', authorize('admin'), buildingController.remove);

export default router;
