import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import * as reportController from '../controllers/report.controller.js';
import {
  revenueSchema,
  revenueByVehicleSchema,
  revenueComparisonSchema,
  dateRangeSchema,
  occupancyTrendSchema,
  peakHoursSchema,
  topVehiclesSchema,
} from '../validations/report.validation.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'manager'));

router.get('/dashboard', reportController.getDashboard);

router.get('/revenue', validate(revenueSchema, 'query'), reportController.getRevenue);
router.get('/revenue/by-vehicle', validate(revenueByVehicleSchema, 'query'), reportController.getRevenueByVehicle);
router.get('/revenue/comparison', validate(revenueComparisonSchema, 'query'), reportController.getRevenueComparison);

router.get('/sessions', validate(dateRangeSchema, 'query'), reportController.getSessionStats);
router.get('/bookings', validate(dateRangeSchema, 'query'), reportController.getBookingStats);
router.get('/subscriptions', validate(dateRangeSchema, 'query'), reportController.getSubscriptionStats);

router.get('/occupancy', reportController.getOccupancy);
router.get('/occupancy/trend', validate(occupancyTrendSchema, 'query'), reportController.getOccupancyTrend);

router.get('/peak-hours', validate(peakHoursSchema, 'query'), reportController.getPeakHours);
router.get('/peak-days', validate(peakHoursSchema, 'query'), reportController.getPeakDays);

router.get('/top-vehicles', validate(topVehiclesSchema, 'query'), reportController.getTopVehicles);

router.get('/staff', validate(dateRangeSchema, 'query'), reportController.getStaffStats);

export default router;
