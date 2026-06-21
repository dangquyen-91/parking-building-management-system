import { Op, fn, col, literal } from 'sequelize';
import { sequelize } from '../config/database.js';
import ParkingSession from '../models/parking-session.model.js';
import SessionPayment from '../models/session-payment.model.js';
import BookingPayment from '../models/booking-payment.model.js';
import SubscriptionPayment from '../models/subscription-payment.model.js';
import Booking from '../models/booking.model.js';
import ResidentSubscription from '../models/resident-subscription.model.js';
import ParkingPackage from '../models/parking-package.model.js';
import Floor from '../models/floor.model.js';
import ParkingSlot from '../models/parking-slot.model.js';
import ParkingRow from '../models/parking-row.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';

const parseDateRange = (from, to) => {
  const start = from ? new Date(from) : new Date(new Date().setHours(0, 0, 0, 0));
  const end = to ? new Date(to) : new Date(new Date().setHours(23, 59, 59, 999));
  if (isNaN(start) || isNaN(end)) throw new AppError('Invalid date format', 400);
  if (start > end) throw new AppError('from must be before to', 400);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const groupByFormat = (groupBy) => {
  switch (groupBy) {
    case 'week': return '%Y-%u';
    case 'month': return '%Y-%m';
    default: return '%Y-%m-%d';
  }
};

export const getDashboard = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const dateWhere = { createdAt: { [Op.between]: [todayStart, todayEnd] } };

  const [
    activeTotal,
    activeMoto,
    activeCar,
    completedToday,
    sessionRevToday,
    bookingRevToday,
    subRevToday,
    pendingBookings,
    confirmedBookings,
  ] = await Promise.all([
    ParkingSession.count({ where: { status: 'active' } }),
    ParkingSession.count({ where: { status: 'active', vehicleType: 'motorcycle' } }),
    ParkingSession.count({ where: { status: 'active', vehicleType: 'car' } }),
    ParkingSession.count({ where: { status: 'completed', ...dateWhere } }),
    SessionPayment.sum('amount', { where: { status: 'success', ...dateWhere } }),
    BookingPayment.sum('amount', { where: { status: 'success', ...dateWhere } }),
    SubscriptionPayment.sum('amount', { where: { status: 'success', ...dateWhere } }),
    Booking.count({ where: { status: 'pending', ...dateWhere } }),
    Booking.count({ where: { status: 'confirmed', ...dateWhere } }),
  ]);

  const totalRevenue = (sessionRevToday || 0) + (bookingRevToday || 0) + (subRevToday || 0);

  return {
    activeSessions: {
      total: activeTotal,
      motorcycle: activeMoto,
      car: activeCar,
    },
    completedSessionsToday: completedToday,
    revenueToday: {
      total: totalRevenue,
      fromSessions: sessionRevToday || 0,
      fromBookings: bookingRevToday || 0,
      fromSubscriptions: subRevToday || 0,
    },
    bookingsToday: {
      pending: pendingBookings,
      confirmed: confirmedBookings,
    },
  };
};

export const getRevenue = async ({ from, to, groupBy = 'day' }) => {
  const { start, end } = parseDateRange(from, to);
  const fmt = groupByFormat(groupBy);
  const dateWhere = { status: 'success', createdAt: { [Op.between]: [start, end] } };
  const groupExpr = fn('DATE_FORMAT', col('createdAt'), fmt);

  const [sessions, bookings, subscriptions] = await Promise.all([
    SessionPayment.findAll({
      where: dateWhere,
      attributes: [
        [groupExpr, 'period'],
        [fn('SUM', col('amount')), 'revenue'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [literal(`DATE_FORMAT(createdAt, '${fmt}')`)],
      order: [[literal(`DATE_FORMAT(createdAt, '${fmt}')`), 'ASC']],
      raw: true,
    }),
    BookingPayment.findAll({
      where: dateWhere,
      attributes: [
        [groupExpr, 'period'],
        [fn('SUM', col('amount')), 'revenue'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [literal(`DATE_FORMAT(createdAt, '${fmt}')`)],
      order: [[literal(`DATE_FORMAT(createdAt, '${fmt}')`), 'ASC']],
      raw: true,
    }),
    SubscriptionPayment.findAll({
      where: dateWhere,
      attributes: [
        [groupExpr, 'period'],
        [fn('SUM', col('amount')), 'revenue'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [literal(`DATE_FORMAT(createdAt, '${fmt}')`)],
      order: [[literal(`DATE_FORMAT(createdAt, '${fmt}')`), 'ASC']],
      raw: true,
    }),
  ]);

  const merge = (rows, source) =>
    rows.map((r) => ({ period: r.period, source, revenue: parseFloat(r.revenue) || 0, count: parseInt(r.count) || 0 }));

  const allRows = [...merge(sessions, 'session'), ...merge(bookings, 'booking'), ...merge(subscriptions, 'subscription')];

  const periodMap = {};
  for (const row of allRows) {
    if (!periodMap[row.period]) {
      periodMap[row.period] = { period: row.period, total: 0, session: 0, booking: 0, subscription: 0 };
    }
    periodMap[row.period][row.source] += row.revenue;
    periodMap[row.period].total += row.revenue;
  }

  return Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period));
};

export const getRevenueByVehicle = async ({ from, to, groupBy = 'day' }) => {
  const { start, end } = parseDateRange(from, to);
  const fmt = groupByFormat(groupBy);
  const dateWhere = { status: 'success', createdAt: { [Op.between]: [start, end] } };
  const groupExpr = fn('DATE_FORMAT', col('SessionPayment.createdAt'), fmt);

  const sessionRows = await SessionPayment.findAll({
    where: dateWhere,
    include: [{ model: ParkingSession, as: 'session', attributes: ['vehicleType'] }],
    attributes: [
      [groupExpr, 'period'],
      [fn('SUM', col('SessionPayment.amount')), 'revenue'],
      [col('session.vehicleType'), 'vehicleType'],
    ],
    group: [
      literal(`DATE_FORMAT(SessionPayment.createdAt, '${fmt}')`),
      col('session.vehicleType'),
    ],
    order: [[literal(`DATE_FORMAT(SessionPayment.createdAt, '${fmt}')`), 'ASC']],
    raw: true,
  });

  const bookingRows = await BookingPayment.findAll({
    where: dateWhere,
    attributes: [
      [fn('DATE_FORMAT', col('BookingPayment.createdAt'), fmt), 'period'],
      [fn('SUM', col('BookingPayment.amount')), 'revenue'],
    ],
    group: [literal(`DATE_FORMAT(BookingPayment.createdAt, '${fmt}')`)],
    order: [[literal(`DATE_FORMAT(BookingPayment.createdAt, '${fmt}')`), 'ASC']],
    raw: true,
  });

  const subRows = await SubscriptionPayment.findAll({
    where: dateWhere,
    include: [{ model: ResidentSubscription, as: 'subscription', attributes: ['vehicleType'] }],
    attributes: [
      [fn('DATE_FORMAT', col('SubscriptionPayment.createdAt'), fmt), 'period'],
      [fn('SUM', col('SubscriptionPayment.amount')), 'revenue'],
      [col('subscription.vehicleType'), 'vehicleType'],
    ],
    group: [
      literal(`DATE_FORMAT(SubscriptionPayment.createdAt, '${fmt}')`),
      col('subscription.vehicleType'),
    ],
    order: [[literal(`DATE_FORMAT(SubscriptionPayment.createdAt, '${fmt}')`), 'ASC']],
    raw: true,
  });

  const periodMap = {};
  const ensure = (period) => {
    if (!periodMap[period]) periodMap[period] = { period, motorcycle: 0, car: 0, total: 0 };
  };

  for (const r of sessionRows) {
    ensure(r.period);
    const vt = r['session.vehicleType'] || r.vehicleType;
    if (vt === 'motorcycle' || vt === 'car') {
      periodMap[r.period][vt] += parseFloat(r.revenue) || 0;
      periodMap[r.period].total += parseFloat(r.revenue) || 0;
    }
  }
  for (const r of bookingRows) {
    ensure(r.period);
    periodMap[r.period].car += parseFloat(r.revenue) || 0;
    periodMap[r.period].total += parseFloat(r.revenue) || 0;
  }
  for (const r of subRows) {
    ensure(r.period);
    const vt = r['subscription.vehicleType'] || r.vehicleType;
    if (vt === 'motorcycle' || vt === 'car') {
      periodMap[r.period][vt] += parseFloat(r.revenue) || 0;
      periodMap[r.period].total += parseFloat(r.revenue) || 0;
    }
  }

  return Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period));
};

const buildComparisonRange = (period) => {
  const now = new Date();
  let curStart, curEnd, prevStart, prevEnd;

  if (period === 'week') {
    const day = now.getDay();
    curStart = new Date(now); curStart.setDate(now.getDate() - day); curStart.setHours(0, 0, 0, 0);
    curEnd = new Date(now); curEnd.setHours(23, 59, 59, 999);
    prevStart = new Date(curStart); prevStart.setDate(curStart.getDate() - 7);
    prevEnd = new Date(curStart); prevEnd.setMilliseconds(-1);
  } else if (period === 'year') {
    curStart = new Date(now.getFullYear(), 0, 1);
    curEnd = new Date(now); curEnd.setHours(23, 59, 59, 999);
    prevStart = new Date(now.getFullYear() - 1, 0, 1);
    prevEnd = new Date(now.getFullYear(), 0, 0, 23, 59, 59, 999);
  } else {
    curStart = new Date(now.getFullYear(), now.getMonth(), 1);
    curEnd = new Date(now); curEnd.setHours(23, 59, 59, 999);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }

  return { curStart, curEnd, prevStart, prevEnd };
};

const sumRevenue = async (start, end) => {
  const where = { status: 'success', createdAt: { [Op.between]: [start, end] } };
  const [s, b, sub] = await Promise.all([
    SessionPayment.sum('amount', { where }),
    BookingPayment.sum('amount', { where }),
    SubscriptionPayment.sum('amount', { where }),
  ]);
  return (s || 0) + (b || 0) + (sub || 0);
};

export const getRevenueComparison = async ({ period = 'month' }) => {
  if (!['week', 'month', 'year'].includes(period)) throw new AppError('period must be week|month|year', 400);
  const { curStart, curEnd, prevStart, prevEnd } = buildComparisonRange(period);
  const [current, previous] = await Promise.all([sumRevenue(curStart, curEnd), sumRevenue(prevStart, prevEnd)]);
  const change = previous === 0 ? null : ((current - previous) / previous) * 100;
  return {
    period,
    current: { from: curStart, to: curEnd, revenue: current },
    previous: { from: prevStart, to: prevEnd, revenue: previous },
    changePercent: change !== null ? Math.round(change * 100) / 100 : null,
  };
};

export const getSessionStats = async ({ from, to }) => {
  const { start, end } = parseDateRange(from, to);
  const where = { createdAt: { [Op.between]: [start, end] } };

  const [total, byType, byStatus, avgDuration] = await Promise.all([
    ParkingSession.count({ where }),
    ParkingSession.findAll({
      where,
      attributes: ['vehicleType', [fn('COUNT', col('id')), 'count']],
      group: ['vehicleType'],
      raw: true,
    }),
    ParkingSession.findAll({
      where,
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    ParkingSession.findAll({
      where: { ...where, status: 'completed', exitTime: { [Op.not]: null } },
      attributes: [
        [fn('AVG', literal('TIMESTAMPDIFF(MINUTE, entryTime, exitTime)')), 'avgMinutes'],
      ],
      raw: true,
    }),
  ]);

  return {
    total,
    byVehicleType: Object.fromEntries(byType.map((r) => [r.vehicleType, parseInt(r.count)])),
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, parseInt(r.count)])),
    avgDurationMinutes: Math.round(parseFloat(avgDuration[0]?.avgMinutes) || 0),
  };
};

export const getBookingStats = async ({ from, to }) => {
  const { start, end } = parseDateRange(from, to);
  const where = { createdAt: { [Op.between]: [start, end] } };

  const rows = await Booking.findAll({
    where,
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  const counts = Object.fromEntries(rows.map((r) => [r.status, parseInt(r.count)]));
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const confirmed = counts.confirmed || 0;
  const pending = counts.pending || 0;
  const cancelled = counts.cancelled || 0;
  const expired = counts.expired || 0;

  const conversionRate = total > 0 ? Math.round((confirmed / total) * 10000) / 100 : 0;

  const completedWithSession = await Booking.count({
    where: { ...where, status: 'confirmed', sessionId: { [Op.not]: null } },
  });
  const noShowRate =
    confirmed > 0 ? Math.round(((confirmed - completedWithSession) / confirmed) * 10000) / 100 : 0;

  return {
    total,
    byStatus: { pending, confirmed, cancelled, expired },
    conversionRate,
    noShowRate,
    checkedIn: completedWithSession,
  };
};

export const getSubscriptionStats = async ({ from, to }) => {
  const { start, end } = parseDateRange(from, to);

  const [activeByPlan, expiringIn7Days, newInRange] = await Promise.all([
    ResidentSubscription.findAll({
      where: { status: 'active' },
      include: [{ model: ParkingPackage, as: 'package', attributes: ['id', 'name', 'vehicleType', 'durationDays'] }],
      attributes: [
        'packageId',
        'vehicleType',
        [fn('COUNT', col('ResidentSubscription.id')), 'count'],
      ],
      group: ['packageId', 'vehicleType', 'package.id', 'package.name', 'package.vehicleType', 'package.durationDays'],
      raw: true,
    }),
    ResidentSubscription.count({
      where: {
        status: 'active',
        endDate: { [Op.between]: [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] },
      },
    }),
    ResidentSubscription.findAll({
      where: { status: { [Op.in]: ['active', 'expired'] }, createdAt: { [Op.between]: [start, end] } },
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true,
    }),
  ]);

  return {
    activeByPlan: activeByPlan.map((r) => ({
      packageId: r.packageId,
      packageName: r['package.name'],
      vehicleType: r.vehicleType,
      count: parseInt(r.count),
    })),
    expiringIn7Days,
    newSubscriptionsDaily: newInRange.map((r) => ({ date: r.date, count: parseInt(r.count) })),
  };
};

export const getOccupancy = async () => {
  const floors = await Floor.findAll({
    where: { isActive: true },
    attributes: ['id', 'floorNumber', 'vehicleType', 'floorType', 'totalSlots'],
    include: [
      {
        model: ParkingSlot,
        as: 'slots',
        attributes: ['id', 'status'],
        required: false,
      },
      {
        model: ParkingRow,
        as: 'rows',
        attributes: ['id', 'capacity', 'occupiedCount', 'status'],
        required: false,
      },
    ],
  });

  return floors.map((floor) => {
    if (floor.vehicleType === 'car') {
      const totalSlots = floor.slots.length;
      const occupied = floor.slots.filter((s) => s.status === 'occupied').length;
      const reserved = floor.slots.filter((s) => s.status === 'reserved').length;
      const available = floor.slots.filter((s) => s.status === 'empty').length;
      return {
        floorId: floor.id,
        floorNumber: floor.floorNumber,
        vehicleType: 'car',
        floorType: floor.floorType,
        totalSlots,
        occupied,
        reserved,
        available,
        occupancyRate: totalSlots > 0 ? Math.round(((occupied + reserved) / totalSlots) * 10000) / 100 : 0,
      };
    } else {
      const totalCapacity = floor.rows.reduce((s, r) => s + (r.capacity || 0), 0);
      const totalOccupied = floor.rows.reduce((s, r) => s + (r.occupiedCount || 0), 0);
      return {
        floorId: floor.id,
        floorNumber: floor.floorNumber,
        vehicleType: 'motorcycle',
        floorType: floor.floorType,
        totalCapacity,
        occupied: totalOccupied,
        available: Math.max(0, totalCapacity - totalOccupied),
        occupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 10000) / 100 : 0,
      };
    }
  });
};

export const getOccupancyTrend = async ({ from, to, floorId }) => {
  const { start, end } = parseDateRange(from, to);
  const where = { entryTime: { [Op.between]: [start, end] }, status: { [Op.in]: ['active', 'completed'] } };
  if (floorId) where.floorId = parseInt(floorId);

  const rows = await ParkingSession.findAll({
    where,
    attributes: [
      [fn('DATE', col('entryTime')), 'date'],
      'floorId',
      [fn('COUNT', col('id')), 'checkIns'],
    ],
    group: [fn('DATE', col('entryTime')), 'floorId'],
    order: [[fn('DATE', col('entryTime')), 'ASC']],
    raw: true,
  });

  return rows.map((r) => ({
    date: r.date,
    floorId: r.floorId,
    checkIns: parseInt(r.checkIns),
  }));
};

export const getPeakHours = async ({ days = 30 }) => {
  const daysInt = Math.min(Math.max(parseInt(days) || 30, 1), 365);
  const since = new Date(Date.now() - daysInt * 24 * 60 * 60 * 1000);

  const rows = await ParkingSession.findAll({
    where: { entryTime: { [Op.gte]: since } },
    attributes: [
      [fn('HOUR', col('entryTime')), 'hour'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('HOUR', col('entryTime'))],
    order: [[fn('HOUR', col('entryTime')), 'ASC']],
    raw: true,
  });

  const hourMap = Object.fromEntries(Array.from({ length: 24 }, (_, h) => [h, 0]));
  for (const r of rows) hourMap[parseInt(r.hour)] = parseInt(r.count);

  return Object.entries(hourMap).map(([hour, count]) => ({ hour: parseInt(hour), count }));
};

export const getStaffStats = async ({ from, to }) => {
  const { start, end } = parseDateRange(from, to);
  const where = { createdAt: { [Op.between]: [start, end] } };

  const staffRows = await ParkingSession.findAll({
    where,
    include: [{ model: User, as: 'staff', attributes: ['id', 'fullName'] }],
    attributes: [
      'staffId',
      [fn('COUNT', col('ParkingSession.id')), 'totalSessions'],
      [fn('SUM', literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completedSessions'],
      [fn('SUM', literal("CASE WHEN paymentStatus = 'paid' AND status = 'completed' THEN 1 ELSE 0 END")), 'paidSessions'],
    ],
    group: ['staffId', 'staff.id', 'staff.fullName'],
    raw: true,
  });

  const cashRows = await SessionPayment.findAll({
    where: { status: 'success', paymentMethod: 'cash', createdAt: { [Op.between]: [start, end] } },
    include: [{ model: ParkingSession, as: 'session', attributes: ['staffId'] }],
    attributes: [
      [col('session.staffId'), 'staffId'],
      [fn('SUM', col('SessionPayment.amount')), 'cashCollected'],
    ],
    group: [col('session.staffId')],
    raw: true,
  });

  const cashMap = Object.fromEntries(
    cashRows.map((r) => [r['session.staffId'] ?? r.staffId, parseFloat(r.cashCollected) || 0])
  );

  return staffRows.map((r) => ({
    staffId: r.staffId,
    staffName: r['staff.fullName'],
    totalSessions: parseInt(r.totalSessions),
    completedSessions: parseInt(r.completedSessions),
    paidSessions: parseInt(r.paidSessions),
    cashCollected: cashMap[r.staffId] || 0,
  }));
};
