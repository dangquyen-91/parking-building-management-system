import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as floorController from '../controllers/floor.controller.js';
import { createFloorSchema, updateFloorSchema } from '../validations/floor.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', floorController.getAll);
router.get('/:id', floorController.getById);

router.post('/', authorize('admin', 'manager'), validate(createFloorSchema), floorController.create);
router.patch('/:id', authorize('admin', 'manager'), validate(updateFloorSchema), floorController.update);

router.delete('/:id', authorize('admin'), floorController.remove);

export default router;
