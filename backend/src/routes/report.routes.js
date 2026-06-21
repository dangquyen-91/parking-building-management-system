import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import * as reportController from '../controllers/report.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'manager'));

router.get('/dashboard', reportController.getDashboard);

router.get('/revenue', reportController.getRevenue);
router.get('/revenue/by-vehicle', reportController.getRevenueByVehicle);
router.get('/revenue/comparison', reportController.getRevenueComparison);

router.get('/sessions', reportController.getSessionStats);
router.get('/bookings', reportController.getBookingStats);
router.get('/subscriptions', reportController.getSubscriptionStats);

router.get('/occupancy', reportController.getOccupancy);
router.get('/occupancy/trend', reportController.getOccupancyTrend);

router.get('/peak-hours', reportController.getPeakHours);

router.get('/staff', reportController.getStaffStats);

export default router;
