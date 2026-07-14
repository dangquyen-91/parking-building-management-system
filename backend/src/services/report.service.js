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

const parseLocalDate = (value, endOfDay = false) => {
  if (!value) {
    const now = new Date();
    now.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return now;
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError('Invalid date format', 400);
  date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return date;
};

const parseDateRange = (from, to) => {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to, true);
  if (start > end) throw new AppError('from must be before to', 400);
  return { start, end };
};

const groupBySql = (columnName, groupBy) => {
  switch (groupBy) {
    case 'week': return `DATE_FORMAT(${columnName}, '%x-%v')`;
    case 'month': return `DATE_FORMAT(${columnName}, '%Y-%m')`;
    case 'quarter': return `CONCAT(YEAR(${columnName}), '-Q', QUARTER(${columnName}))`;
    case 'year': return `DATE_FORMAT(${columnName}, '%Y')`;
    default: return `DATE_FORMAT(${columnName}, '%Y-%m-%d')`;
  }
};

export const getDashboard = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const paymentDateWhere = { paidAt: { [Op.between]: [todayStart, todayEnd] } };

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
    ParkingSession.count({ where: { status: 'completed', exitTime: { [Op.between]: [todayStart, todayEnd] } } }),
    SessionPayment.sum('amount', { where: { status: 'success', ...paymentDateWhere } }),
    BookingPayment.sum('amount', { where: { status: 'success', ...paymentDateWhere } }),
    SubscriptionPayment.sum('amount', { where: { status: 'success', ...paymentDateWhere } }),
    Booking.count({ where: { status: 'pending', createdAt: { [Op.between]: [todayStart, todayEnd] } } }),
    Booking.count({ where: { status: 'confirmed', createdAt: { [Op.between]: [todayStart, todayEnd] } } }),
  ]);

  const sessionRevenue = Number(sessionRevToday) || 0;
  const bookingRevenue = Number(bookingRevToday) || 0;
  const subscriptionRevenue = Number(subRevToday) || 0;
  const totalRevenue = sessionRevenue + bookingRevenue + subscriptionRevenue;

  return {
    activeSessions: {
      total: activeTotal,
      motorcycle: activeMoto,
      car: activeCar,
    },
    completedSessionsToday: completedToday,
    revenueToday: {
      total: totalRevenue,
      fromSessions: sessionRevenue,
      fromBookings: bookingRevenue,
      fromSubscriptions: subscriptionRevenue,
    },
    bookingsToday: {
      pending: pendingBookings,
      confirmed: confirmedBookings,
    },
  };
};

export const getRevenue = async ({ from, to, groupBy = 'day' }) => {
  const { start, end } = parseDateRange(from, to);
  const periodSql = groupBySql('paidAt', groupBy);
  const dateWhere = { status: 'success', paidAt: { [Op.between]: [start, end] } };

  const revenueAttributes = [
    [literal(periodSql), 'period'],
    [fn('SUM', col('amount')), 'revenue'],
    [fn('COUNT', col('id')), 'count'],
    [fn('SUM', literal("CASE WHEN paymentMethod = 'cash' THEN amount ELSE 0 END")), 'cash'],
    [fn('SUM', literal("CASE WHEN paymentMethod = 'vnpay' THEN amount ELSE 0 END")), 'vnpay'],
  ];

  const queryOptions = {
    where: dateWhere,
    attributes: revenueAttributes,
    group: [literal(periodSql)],
    order: [[literal(periodSql), 'ASC']],
    raw: true,
  };

  const [sessions, bookings, subscriptions] = await Promise.all([
    SessionPayment.findAll(queryOptions),
    BookingPayment.findAll(queryOptions),
    SubscriptionPayment.findAll(queryOptions),
  ]);

  const merge = (rows, source) =>
    rows.map((r) => ({
      period: r.period,
      source,
      revenue: parseFloat(r.revenue) || 0,
      count: parseInt(r.count, 10) || 0,
      cash: parseFloat(r.cash) || 0,
      vnpay: parseFloat(r.vnpay) || 0,
    }));

  const allRows = [...merge(sessions, 'session'), ...merge(bookings, 'booking'), ...merge(subscriptions, 'subscription')];

  const periodMap = {};
  for (const row of allRows) {
    if (!periodMap[row.period]) {
      periodMap[row.period] = {
        period: row.period,
        total: 0,
        session: 0,
        booking: 0,
        subscription: 0,
        count: 0,
        sessionCount: 0,
        bookingCount: 0,
        subscriptionCount: 0,
        cash: 0,
        vnpay: 0,
      };
    }
    periodMap[row.period][row.source] += row.revenue;
    periodMap[row.period][`${row.source}Count`] += row.count;
    periodMap[row.period].total += row.revenue;
    periodMap[row.period].count += row.count;
    periodMap[row.period].cash += row.cash;
    periodMap[row.period].vnpay += row.vnpay;
  }

  return Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period));
};

export const getRevenueByVehicle = async ({ from, to, groupBy = 'day' }) => {
  const { start, end } = parseDateRange(from, to);
  const dateWhere = { status: 'success', paidAt: { [Op.between]: [start, end] } };
  const sessionPeriodSql = groupBySql('SessionPayment.paidAt', groupBy);
  const bookingPeriodSql = groupBySql('BookingPayment.paidAt', groupBy);
  const subscriptionPeriodSql = groupBySql('SubscriptionPayment.paidAt', groupBy);

  const sessionRows = await SessionPayment.findAll({
    where: dateWhere,
    include: [{ model: ParkingSession, as: 'session', attributes: ['vehicleType'] }],
    attributes: [
      [literal(sessionPeriodSql), 'period'],
      [fn('SUM', col('SessionPayment.amount')), 'revenue'],
      [col('session.vehicleType'), 'vehicleType'],
    ],
    group: [
      literal(sessionPeriodSql),
      col('session.vehicleType'),
    ],
    order: [[literal(sessionPeriodSql), 'ASC']],
    raw: true,
  });

  const bookingRows = await BookingPayment.findAll({
    where: dateWhere,
    attributes: [
      [literal(bookingPeriodSql), 'period'],
      [fn('SUM', col('BookingPayment.amount')), 'revenue'],
    ],
    group: [literal(bookingPeriodSql)],
    order: [[literal(bookingPeriodSql), 'ASC']],
    raw: true,
  });

  const subRows = await SubscriptionPayment.findAll({
    where: dateWhere,
    include: [{ model: ResidentSubscription, as: 'subscription', attributes: ['vehicleType'] }],
    attributes: [
      [literal(subscriptionPeriodSql), 'period'],
      [fn('SUM', col('SubscriptionPayment.amount')), 'revenue'],
      [col('subscription.vehicleType'), 'vehicleType'],
    ],
    group: [
      literal(subscriptionPeriodSql),
      col('subscription.vehicleType'),
    ],
    order: [[literal(subscriptionPeriodSql), 'ASC']],
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

const buildCurrentPeriodRange = (period) => {
  const now = new Date();
  let curStart;

  if (period === 'week') {
    curStart = new Date(now);
    const mondayOffset = (now.getDay() + 6) % 7;
    curStart.setDate(now.getDate() - mondayOffset);
    curStart.setHours(0, 0, 0, 0);
  } else if (period === 'quarter') {
    curStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  } else if (period === 'year') {
    curStart = new Date(now.getFullYear(), 0, 1);
  } else {
    curStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { start: curStart, end: now };
};

const shiftOneYearBack = (value) => {
  const month = value.getMonth();
  const day = value.getDate();
  const targetYear = value.getFullYear() - 1;
  const lastDay = new Date(targetYear, month + 1, 0).getDate();
  const shifted = new Date(value);
  shifted.setFullYear(targetYear, month, Math.min(day, lastDay));
  return shifted;
};

const shiftMonthsBack = (value, months) => {
  const sourceYear = value.getFullYear();
  const sourceMonth = value.getMonth();
  const sourceDay = value.getDate();
  const isLastDayOfMonth = sourceDay === new Date(sourceYear, sourceMonth + 1, 0).getDate();
  const targetMonthStart = new Date(sourceYear, sourceMonth - months, 1);
  const targetLastDay = new Date(
    targetMonthStart.getFullYear(),
    targetMonthStart.getMonth() + 1,
    0,
  ).getDate();
  const shifted = new Date(value);
  shifted.setFullYear(
    targetMonthStart.getFullYear(),
    targetMonthStart.getMonth(),
    isLastDayOfMonth ? targetLastDay : Math.min(sourceDay, targetLastDay),
  );
  return shifted;
};

const buildComparisonRange = (current, compare, period) => {
  if (compare === 'previous_year') {
    return {
      start: shiftOneYearBack(current.start),
      end: shiftOneYearBack(current.end),
    };
  }

  if (period) {
    const shift = (value) => {
      if (period === 'day') {
        const shifted = new Date(value);
        shifted.setDate(shifted.getDate() - 1);
        return shifted;
      }
      if (period === 'week') {
        const shifted = new Date(value);
        shifted.setDate(shifted.getDate() - 7);
        return shifted;
      }
      if (period === 'month') return shiftMonthsBack(value, 1);
      if (period === 'quarter') return shiftMonthsBack(value, 3);
      return shiftOneYearBack(value);
    };
    return { start: shift(current.start), end: shift(current.end) };
  }

  const currentStartDay = new Date(current.start);
  currentStartDay.setHours(0, 0, 0, 0);
  const currentEndDay = new Date(current.end);
  currentEndDay.setHours(0, 0, 0, 0);
  const days = Math.round((currentEndDay - currentStartDay) / 86_400_000) + 1;
  const previousEnd = new Date(currentStartDay);
  previousEnd.setMilliseconds(-1);
  const previousStart = new Date(currentStartDay);
  previousStart.setDate(previousStart.getDate() - days);

  return { start: previousStart, end: previousEnd };
};

const sumRevenue = async (start, end) => {
  const where = { status: 'success', paidAt: { [Op.between]: [start, end] } };
  const [s, b, sub] = await Promise.all([
    SessionPayment.sum('amount', { where }),
    BookingPayment.sum('amount', { where }),
    SubscriptionPayment.sum('amount', { where }),
  ]);
  return (Number(s) || 0) + (Number(b) || 0) + (Number(sub) || 0);
};

export const getRevenueComparison = async ({
  from,
  to,
  compare = 'previous_period',
  period,
}) => {
  if (!['previous_period', 'previous_year'].includes(compare)) {
    throw new AppError('compare must be previous_period|previous_year', 400);
  }

  const currentRange = from || to
    ? parseDateRange(from, to)
    : buildCurrentPeriodRange(period ?? 'month');
  const comparisonRange = buildComparisonRange(currentRange, compare, from || to ? period : undefined);
  const [current, previous] = await Promise.all([
    sumRevenue(currentRange.start, currentRange.end),
    sumRevenue(comparisonRange.start, comparisonRange.end),
  ]);
  const change = previous === 0 ? null : ((current - previous) / previous) * 100;
  return {
    period: period ?? 'month',
    compare,
    current: { from: currentRange.start, to: currentRange.end, revenue: current },
    previous: { from: comparisonRange.start, to: comparisonRange.end, revenue: previous },
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

  // Đếm số phiên đang hoạt động theo tầng — nguồn đúng cho tầng ô tô vãng lai
  // (check-in vãng lai không gán slot vật lý nên không thể suy ra từ trạng thái slot).
  const activeRows = await ParkingSession.findAll({
    where: { status: 'active' },
    attributes: ['floorId', [fn('COUNT', col('id')), 'cnt']],
    group: ['floorId'],
    raw: true,
  });
  const activeByFloor = new Map(activeRows.map((r) => [r.floorId, Number(r.cnt)]));

  return floors.map((floor) => {
    if (floor.vehicleType === 'car') {
      // Tầng vãng lai "đếm theo tầng": số xe = số phiên đang hoạt động, sức chứa = floor.totalSlots.
      if (floor.floorType === 'visitor') {
        const totalSlots = floor.totalSlots;
        const occupied = activeByFloor.get(floor.id) || 0;
        const available = Math.max(0, totalSlots - occupied);
        return {
          floorId: floor.id,
          floorNumber: floor.floorNumber,
          vehicleType: 'car',
          floorType: floor.floorType,
          totalSlots,
          occupied,
          reserved: 0,
          available,
          occupancyRate: totalSlots > 0 ? Math.round((occupied / totalSlots) * 10000) / 100 : 0,
        };
      }
      // Tầng cư dân: mỗi xe có slot cố định → suy từ trạng thái slot vật lý.
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

// Khoảng lọc cho biểu đồ cao điểm: ưu tiên from/to (đồng bộ filter của trang),
// nếu không có thì lùi về cửa sổ "N ngày gần nhất".
const buildPeakWhere = ({ from, to, days = 30 }) => {
  if (from || to) {
    const { start, end } = parseDateRange(from, to);
    return { entryTime: { [Op.between]: [start, end] } };
  }
  const daysInt = Math.min(Math.max(parseInt(days) || 30, 1), 365);
  const since = new Date(Date.now() - daysInt * 24 * 60 * 60 * 1000);
  return { entryTime: { [Op.gte]: since } };
};

export const getPeakHours = async ({ from, to, days = 30 } = {}) => {
  const rows = await ParkingSession.findAll({
    where: buildPeakWhere({ from, to, days }),
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const getPeakDays = async ({ from, to, days = 30 } = {}) => {
  const rows = await ParkingSession.findAll({
    where: buildPeakWhere({ from, to, days }),
    attributes: [
      [fn('DAYOFWEEK', col('entryTime')), 'dayOfWeek'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DAYOFWEEK', col('entryTime'))],
    order: [[fn('DAYOFWEEK', col('entryTime')), 'ASC']],
    raw: true,
  });

  // MySQL DAYOFWEEK: 1=Sunday, 2=Monday, ..., 7=Saturday
  const dowMap = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i + 1, 0]));
  for (const r of rows) dowMap[parseInt(r.dayOfWeek)] = parseInt(r.count);

  return Object.entries(dowMap).map(([dow, count]) => ({
    dayOfWeek: parseInt(dow),
    dayName: DAY_NAMES[parseInt(dow) - 1],
    isWeekend: parseInt(dow) === 1 || parseInt(dow) === 7,
    count,
  }));
};

export const getTopVehicles = async ({ from, to, limit = 10, vehicleType, dayType }) => {
  const { start, end } = parseDateRange(from, to);
  const limitInt = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

  const where = { createdAt: { [Op.between]: [start, end] }, status: 'completed' };
  if (vehicleType) where.vehicleType = vehicleType;
  // MySQL DAYOFWEEK: 1=Sunday, 7=Saturday → weekend = (1,7), weekday = (2..6)
  if (dayType === 'weekend') where[Op.and] = [literal('DAYOFWEEK(entryTime) IN (1, 7)')];
  else if (dayType === 'weekday') where[Op.and] = [literal('DAYOFWEEK(entryTime) IN (2, 3, 4, 5, 6)')];

  const rows = await ParkingSession.findAll({
    where,
    attributes: [
      'licensePlate',
      'vehicleType',
      [fn('COUNT', col('id')), 'sessionCount'],
      [fn('SUM', col('fee')), 'totalFee'],
      [fn('MAX', col('entryTime')), 'lastSeen'],
    ],
    group: ['licensePlate', 'vehicleType'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit: limitInt,
    raw: true,
  });

  return rows.map((r, i) => ({
    rank: i + 1,
    licensePlate: r.licensePlate,
    vehicleType: r.vehicleType,
    sessionCount: parseInt(r.sessionCount),
    totalFee: parseFloat(r.totalFee) || 0,
    lastSeen: r.lastSeen,
  }));
};

export const getTopUsers = async ({ from, to, limit = 10 }) => {
  const { start, end } = parseDateRange(from, to);
  const limitInt = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

  // Chỉ tính phiên gắn với user đã đăng nhập (cư dân / người đặt chỗ);
  // khách vãng lai check-in tay có userId = null nên không nằm trong bảng này.
  const rows = await ParkingSession.findAll({
    where: { createdAt: { [Op.between]: [start, end] }, status: 'completed', userId: { [Op.not]: null } },
    include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
    attributes: [
      'userId',
      [fn('COUNT', col('ParkingSession.id')), 'sessionCount'],
      [fn('SUM', col('ParkingSession.fee')), 'totalFee'],
      [fn('MAX', col('ParkingSession.entryTime')), 'lastVisit'],
    ],
    group: ['userId', 'user.id', 'user.fullName', 'user.email'],
    order: [[fn('COUNT', col('ParkingSession.id')), 'DESC']],
    limit: limitInt,
    raw: true,
  });

  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    fullName: r['user.fullName'],
    email: r['user.email'],
    sessionCount: parseInt(r.sessionCount),
    totalFee: parseFloat(r.totalFee) || 0,
    lastVisit: r.lastVisit,
  }));
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
    where: { status: 'success', paymentMethod: 'cash', paidAt: { [Op.between]: [start, end] } },
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
