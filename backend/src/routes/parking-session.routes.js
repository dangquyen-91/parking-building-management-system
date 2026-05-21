import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as parkingSessionController from '../controllers/parking-session.controller.js';
import { checkInSchema } from '../validations/parking-session.validation.js';

const router = Router();

router.use(authenticate);

// All authenticated: view active sessions and detail
router.get('/', authorize('admin', 'manager', 'staff'), parkingSessionController.getActiveSessions);
router.get('/:id', authorize('admin', 'manager', 'staff'), parkingSessionController.getOne);

// Staff + Admin + Manager: check-in vehicle
router.post('/check-in', authorize('admin', 'manager', 'staff'), validate(checkInSchema), parkingSessionController.checkIn);

export default router;
