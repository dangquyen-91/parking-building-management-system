import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as subscriptionController from '../controllers/subscription.controller.js';
import { buyPackageSchema, activePlateSchema } from '../validations/subscription.validation.js';

const router = Router();

router.use(authenticate);

router.get('/me', subscriptionController.getMine);
router.get(
  '/active',
  authorize('admin', 'manager', 'staff'),
  validate(activePlateSchema, 'query'),
  subscriptionController.getActiveByPlate
);
router.get('/', authorize('admin', 'manager', 'staff'), subscriptionController.getAll);

router.post('/', validate(buyPackageSchema), subscriptionController.buy);
router.post('/expire', authorize('admin', 'manager'), subscriptionController.expire);

router.get('/:id', subscriptionController.getById);

export default router;
