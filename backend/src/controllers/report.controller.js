import * as reportService from '../services/report.service.js';
import response from '../utils/response.js';

const getDashboard = async (req, res, next) => {
  try {
    const data = await reportService.getDashboard();
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getRevenue = async (req, res, next) => {
  try {
    const data = await reportService.getRevenue(req.query);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getRevenueByVehicle = async (req, res, next) => {
  try {
    const data = await reportService.getRevenueByVehicle(req.query);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getRevenueComparison = async (req, res, next) => {
  try {
    const data = await reportService.getRevenueComparison(req.query);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getSessionStats = async (req, res, next) => {
  try {
    const data = await reportService.getSessionStats(req.query);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getBookingStats = async (req, res, next) => {
  try {
    const data = await reportService.getBookingStats(req.query);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getSubscriptionStats = async (req, res, next) => {
  try {
    const data = await reportService.getSubscriptionStats(req.query);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getOccupancy = async (req, res, next) => {
  try {
    const data = await reportService.getOccupancy();
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getOccupancyTrend = async (req, res, next) => {
  try {
    const data = await reportService.getOccupancyTrend(req.query);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getPeakHours = async (req, res, next) => {
  try {
    const data = await reportService.getPeakHours(req.query);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getStaffStats = async (req, res, next) => {
  try {
    const data = await reportService.getStaffStats(req.query);
    response.success(res, data);
  } catch (err) {
    next(err);
  }
};

export {
  getDashboard,
  getRevenue,
  getRevenueByVehicle,
  getRevenueComparison,
  getSessionStats,
  getBookingStats,
  getSubscriptionStats,
  getOccupancy,
  getOccupancyTrend,
  getPeakHours,
  getStaffStats,
};
