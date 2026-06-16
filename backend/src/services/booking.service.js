import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import Booking from '../models/booking.model.js';
import Floor from '../models/floor.model.js';
import ParkingSlot from '../models/parking-slot.model.js';
import User from '../models/user.model.js';
import ResidentSubscription from '../models/resident-subscription.model.js';
import AppError from '../utils/appError.js';
import { calculateFee } from './pricing.service.js';
import { createBookingPayment } from './payment.service.js';
import { sendBookingConfirmation } from './email.service.js';

const FREE_SLOT_THRESHOLD = 0.20;
const MAX_ADVANCE_BOOKING_MS = 24 * 3600_000;
const MIN_DURATION_MS = 60 * 60_000;
const EARLY_GRACE_MS = 30 * 60_000;

const normalizePlate = (plate) => plate.toUpperCase().replace(/\s/g, '');

const findVisitorCarFloor = async (floorId, t) => {
  const where = { vehicleType: 'car', floorType: 'visitor', isActive: true };
  if (floorId) where.id = floorId;
  const floor = await Floor.findOne({ where, transaction: t });
  if (!floor) throw new AppError('Không có tầng ô tô vãng lai khả dụng', 404);
  return floor;
};

const checkFloorCapacity = async (floorId, t) => {
  const total = await ParkingSlot.count({ where: { floorId }, transaction: t });
  if (total === 0) throw new AppError('Tầng này không có slot nào', 400);

  const emptyPhysical = await ParkingSlot.count({
    where: { floorId, status: 'empty' },
    transaction: t,
  });

  const heldByBookings = await Booking.count({
    where: {
      floorId,
      status: 'confirmed',
      sessionId: null,
      endTime: { [Op.gt]: new Date() },
    },
    transaction: t,
  });

  const available = Math.max(0, emptyPhysical - heldByBookings);
  const ratio = available / total;
  if (ratio < FREE_SLOT_THRESHOLD) {
    throw new AppError(
      `Bãi đang quá tải (còn ${Math.round(ratio * 100)}% trống, cần ≥ ${FREE_SLOT_THRESHOLD * 100}%). Tạm thời không nhận booking.`,
      409
    );
  }
  return { total, emptyPhysical, heldByBookings, available, ratio };
};

const validateTimeWindow = (startTime, endTime) => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new AppError('startTime / endTime không hợp lệ', 400);
  }
  if (start <= now) throw new AppError('startTime phải ở tương lai', 400);
  if (start > now + MAX_ADVANCE_BOOKING_MS) {
    throw new AppError('Chỉ cho phép đặt trước tối đa 24 giờ', 400);
  }
  if (end - start < MIN_DURATION_MS) {
    throw new AppError('Thời lượng booking tối thiểu 1 giờ', 400);
  }
};

const resolveCustomer = async (body, requester, t) => {
  const email = (body.customerEmail || '').trim().toLowerCase();

  if (!requester) {
    return {
      userId: null,
      customerName: body.customerName?.trim() || null,
      customerPhone: body.customerPhone?.trim() || null,
      customerEmail: email,
    };
  }

  const user = await User.findByPk(requester.id, { transaction: t });
  if (!user) throw new AppError('User not found', 404);

  return {
    userId: user.id,
    customerName: body.customerName?.trim() || user.fullName,
    customerPhone: body.customerPhone?.trim() || user.phone || null,
    customerEmail: email || user.email,
  };
};

const ensureResidentBooksOwnPlate = async (requester, plate, t) => {
  if (!requester) return;
  const now = new Date();
  const subs = await ResidentSubscription.findAll({
    where: {
      userId: requester.id,
      status: 'active',
      endDate: { [Op.gt]: now },
    },
    attributes: ['licensePlate'],
    transaction: t,
  });
  if (subs.length === 0) return;
  const ownPlates = subs.map((s) => s.licensePlate);
  if (!ownPlates.includes(plate)) {
    throw new AppError(
      `Cư dân chỉ được book cho biển số đã có gói: ${ownPlates.join(', ')}. Không thể book hộ plate khác.`,
      403
    );
  }
};

export const createBooking = async ({ body, requester, ipAddr }) => {
  return sequelize
    .transaction(async (t) => {
      const plate = normalizePlate(body.licensePlate);
      validateTimeWindow(body.startTime, body.endTime);

      await ensureResidentBooksOwnPlate(requester, plate, t);

      const floor = await findVisitorCarFloor(body.floorId, t);
      await checkFloorCapacity(floor.id, t);

      const existing = await Booking.findOne({
        where: {
          licensePlate: plate,
          status: { [Op.in]: ['pending', 'confirmed'] },
          endTime: { [Op.gt]: new Date() },
        },
        transaction: t,
      });
      if (existing) {
        throw new AppError(`Biển số ${plate} đã có booking đang hoạt động (#${existing.id})`, 409);
      }

      const fee = calculateFee(body.startTime, body.endTime, 'car');
      const durationMs = new Date(body.endTime) - new Date(body.startTime);
      const prepaidHours = Math.max(1, Math.ceil(durationMs / 3600_000));

      const customer = await resolveCustomer(body, requester, t);

      const booking = await Booking.create(
        {
          floorId: floor.id,
          slotId: null,
          userId: customer.userId,
          customerName: customer.customerName,
          customerPhone: customer.customerPhone,
          customerEmail: customer.customerEmail,
          licensePlate: plate,
          vehicleType: 'car',
          startTime: body.startTime,
          endTime: body.endTime,
          amount: fee.totalFee,
          prepaidHours,
          status: 'pending',
          note: body.note || null,
        },
        { transaction: t }
      );

      const safeInfo = `Booking ${plate} ${prepaidHours}h`.slice(0, 80);
      const { paymentUrl, orderId } = await createBookingPayment(
        { bookingId: booking.id, amount: fee.totalFee, ipAddr, orderInfo: safeInfo },
        t
      );

      return {
        bookingId: booking.id,
        amount: fee.totalFee,
        prepaidHours,
        paymentUrl,
        orderId,
        breakdown: fee,
        floor: { id: floor.id, floorNumber: floor.floorNumber },
      };
    })
    .catch((err) => {
      if (err?.name === 'SequelizeUniqueConstraintError') {
        throw new AppError(
          `Biển số đã có booking đang hoạt động. Vui lòng kiểm tra lại.`,
          409
        );
      }
      throw err;
    });
};

export const handleBookingPaymentSuccess = async (bookingId, t) => {
  const booking = await Booking.findByPk(bookingId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!booking || booking.status !== 'pending') return;
  await booking.update({ status: 'confirmed' }, { transaction: t });

  const snapshot = {
    id: booking.id,
    licensePlate: booking.licensePlate,
    customerEmail: booking.customerEmail,
    customerName: booking.customerName,
    startTime: booking.startTime,
    endTime: booking.endTime,
    prepaidHours: booking.prepaidHours,
    amount: booking.amount,
  };
  sendBookingConfirmation(snapshot).catch((err) =>
    console.error(`[email] booking #${snapshot.id} confirmation failed:`, err.message)
  );
};

export const handleBookingPaymentFailure = async (bookingId, t) => {
  const booking = await Booking.findByPk(bookingId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!booking || booking.status !== 'pending') return;
  await booking.update({ status: 'cancelled' }, { transaction: t });
};

export const findActiveBookingByPlate = async (licensePlate, t) => {
  const now = new Date();
  const graceCutoff = new Date(now.getTime() + EARLY_GRACE_MS);
  return Booking.findOne({
    where: {
      licensePlate: normalizePlate(licensePlate),
      status: 'confirmed',
      startTime: { [Op.lte]: graceCutoff },
      endTime: { [Op.gte]: now },
      sessionId: null,
    },
    transaction: t,
  });
};

const baseInclude = [
  { model: Floor, as: 'floor', attributes: ['id', 'floorNumber', 'buildingId'] },
  { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
];

export const getMine = async (userId) => {
  return Booking.findAll({
    where: { userId },
    include: baseInclude,
    order: [['createdAt', 'DESC']],
  });
};

export const getById = async (id, requester) => {
  const booking = await Booking.findByPk(id, { include: baseInclude });
  if (!booking) throw new AppError('Booking not found', 404);
  const privileged = ['admin', 'manager', 'staff'].includes(requester.role);
  if (!privileged && booking.userId !== requester.id) {
    throw new AppError('Access denied', 403);
  }
  return booking;
};

export const getAll = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.licensePlate) where.licensePlate = normalizePlate(filters.licensePlate);
  if (filters.startDate || filters.endDate) {
    where.startTime = {};
    if (filters.startDate) where.startTime[Op.gte] = filters.startDate;
    if (filters.endDate) where.startTime[Op.lte] = filters.endDate;
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const { count, rows } = await Booking.findAndCountAll({
    where,
    include: baseInclude,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    bookings: rows,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  };
};

export const cancelBooking = async (id, requester) => {
  return sequelize.transaction(async (t) => {
    const booking = await Booking.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!booking) throw new AppError('Booking not found', 404);

    const privileged = ['admin', 'manager', 'staff'].includes(requester.role);
    if (!privileged && booking.userId !== requester.id) {
      throw new AppError('Access denied', 403);
    }
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new AppError(`Cannot cancel booking with status ${booking.status}`, 409);
    }

    await booking.update(
      {
        status: 'cancelled',
        staffNote: privileged
          ? `Cancelled by ${requester.role} #${requester.id}`
          : 'Cancelled by user',
      },
      { transaction: t }
    );
    return booking;
  });
};

export const expireBookings = async () => {
  const now = new Date();
  const [count] = await Booking.update(
    { status: 'expired' },
    {
      where: {
        status: { [Op.in]: ['pending', 'confirmed'] },
        endTime: { [Op.lt]: now },
        sessionId: null,
      },
    }
  );
  return { expired: count };
};
