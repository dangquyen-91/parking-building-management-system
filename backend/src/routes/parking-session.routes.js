import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as parkingSessionController from '../controllers/parking-session.controller.js';
import { checkInSchema, lookupSchema } from '../validations/parking-session.validation.js';

const router = Router();

router.use(authenticate);

router.get('/lookup', authorize('admin', 'manager', 'staff'), validate(lookupSchema, 'query'), parkingSessionController.lookup);

router.get('/', authorize('admin', 'manager', 'staff'), parkingSessionController.getActiveSessions);
router.get('/:id', authorize('admin', 'manager', 'staff'), parkingSessionController.getOne);

router.post('/check-in', authorize('admin', 'manager', 'staff'), validate(checkInSchema), parkingSessionController.checkIn);

// Check-out: preview fee (quote), then confirm (collect cash, release spot)
router.get('/:id/checkout-preview', authorize('admin', 'manager', 'staff'), parkingSessionController.previewCheckout);
router.post('/:id/check-out', authorize('admin', 'manager', 'staff'), parkingSessionController.checkOut);

export default router;
