import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = Router();

// Public VNPay callbacks (no auth — verified by signature)
router.get('/vnpay/return', paymentController.vnpayReturn);
router.get('/vnpay/ipn', paymentController.vnpayIpn);

// Staff/admin: reconcile a payment by querying VNPay directly (queryDr)
router.get('/:orderId/query', authenticate, authorize('admin', 'manager', 'staff'), paymentController.query);

// Lookup a payment by orderId
router.get('/:orderId', authenticate, paymentController.getByOrderId);

export default router;
