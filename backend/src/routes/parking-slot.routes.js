import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as parkingSlotController from '../controllers/parking-slot.controller.js';
import {
  createParkingSlotSchema,
  updateParkingSlotSchema,
  updateSlotStatusSchema,
} from '../validations/parking-slot.validation.js';

const router = Router();

router.use(authenticate);

// All authenticated users can view slots
router.get('/', parkingSlotController.getAll);
router.get('/:id', parkingSlotController.getById);

// Staff + Admin + Manager: update slot status (e.g. mark maintenance)
router.patch('/:id/status', authorize('admin', 'manager', 'staff'), validate(updateSlotStatusSchema), parkingSlotController.updateStatus);

// Admin + Manager: create and update
router.post('/', authorize('admin', 'manager'), validate(createParkingSlotSchema), parkingSlotController.create);
router.patch('/:id', authorize('admin', 'manager'), validate(updateParkingSlotSchema), parkingSlotController.update);

// Admin only: delete
router.delete('/:id', authorize('admin'), parkingSlotController.remove);

export default router;
