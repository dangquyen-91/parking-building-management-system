import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as parkingRowController from '../controllers/parking-row.controller.js';
import {
  createParkingRowSchema,
  updateParkingRowSchema,
  updateRowStatusSchema,
} from '../validations/parking-row.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', parkingRowController.getAll);
router.get('/:id', parkingRowController.getById);

router.patch('/:id/status', authorize('admin', 'manager', 'staff'), validate(updateRowStatusSchema), parkingRowController.updateStatus);

router.post('/', authorize('admin', 'manager'), validate(createParkingRowSchema), parkingRowController.create);
router.patch('/:id', authorize('admin', 'manager'), validate(updateParkingRowSchema), parkingRowController.update);

router.delete('/:id', authorize('admin'), parkingRowController.remove);

export default router;
