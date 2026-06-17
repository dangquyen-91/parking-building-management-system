import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as vehicleController from '../controllers/vehicle.controller.js';
import { createVehicleSchema, updateVehicleSchema } from '../validations/vehicle.validation.js';

const router = Router();

router.use(authenticate);

router.get('/me', vehicleController.getMine);
router.post('/', validate(createVehicleSchema), vehicleController.create);
router.patch('/:id', validate(updateVehicleSchema), vehicleController.update);
router.delete('/:id', vehicleController.remove);

export default router;
