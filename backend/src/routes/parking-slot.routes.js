import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as parkingSlotController from '../controllers/parking-slot.controller.js';
import {
  createParkingSlotSchema,
  updateParkingSlotSchema,
  updateSlotStatusSchema,
  bulkCreateParkingSlotSchema,
} from '../validations/parking-slot.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', parkingSlotController.getAll);
router.get('/:id', parkingSlotController.getById);

router.patch('/:id/status', authorize('admin', 'manager', 'staff'), validate(updateSlotStatusSchema), parkingSlotController.updateStatus);

router.post('/', authorize('admin', 'manager'), validate(createParkingSlotSchema), parkingSlotController.create);
router.post('/bulk', authorize('admin', 'manager'), validate(bulkCreateParkingSlotSchema), parkingSlotController.bulkCreate);
router.patch('/:id', authorize('admin', 'manager'), validate(updateParkingSlotSchema), parkingSlotController.update);

router.delete('/:id', authorize('admin', 'manager'), parkingSlotController.remove);

export default router;
