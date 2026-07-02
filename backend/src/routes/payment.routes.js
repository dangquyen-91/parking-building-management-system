import { Router } from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth.middleware.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = Router();

router.get('/vnpay/return', paymentController.vnpayReturn);
router.get('/vnpay/ipn', paymentController.vnpayIpn);

router.get('/:orderId/query', authenticate, authorize('admin', 'manager', 'staff'), paymentController.query);

router.get('/:orderId', optionalAuthenticate, paymentController.getByOrderId);

export default router;
