import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as packageController from '../controllers/package.controller.js';
import { createPackageSchema, updatePackageSchema } from '../validations/package.validation.js';

const router = Router();

router.use(authenticate);

router.get('/', packageController.getAll);
router.get('/:id', packageController.getById);

router.post('/', authorize('admin', 'manager'), validate(createPackageSchema), packageController.create);
router.patch('/:id', authorize('admin', 'manager'), validate(updatePackageSchema), packageController.update);
router.delete('/:id', authorize('admin', 'manager'), packageController.remove);

export default router;
