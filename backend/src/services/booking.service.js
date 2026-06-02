import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import Booking from '../models/booking.model.js';
import Floor from '../models/floor.model.js';
import ParkingSlot from '../models/parking-slot.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';
import { calculateFee } from './pricing.service.js';
import { createBookingPayment } from './payment.service.js';

// ── Business rules (chốt với product) ─────────────────────
const FREE_SLOT_THRESHOLD = 0.20;            // booking ngắt khi free slot < 20%
const MAX_ADVANCE_BOOKING_MS = 24 * 3600_000; // chỉ cho book trong vòng 24h tới
const MIN_DURATION_MS = 60 * 60_000;          // booking tối thiểu 1 giờ

const normalizePlate = (plate) => plate.toUpperCase().replace(/\s/g, '');

/**
 * Find the visitor-car floor that booking should land on. Currently picks the
 * first active one; if multiple visitor car floors exist and you want
 * balancing or explicit selection, pass `floorId` in the body.
 */
const findVisitorCarFloor = async (floorId, t) => {
  const where = { vehicleType: 'car', floorType: 'visitor', isActive: true };
  if (floorId) where.id = floorId;
  const floor = await Floor.findOne({ where, transaction: t });
  if (!floor) throw new AppError('Không có tầng ô tô vãng lai khả dụng', 404);
  return floor;
};

/**
 * 20% rule: at least 20% of slots on the floor must be 'empty' right now.
 * Booking is "ảo" — doesn't reserve a slot — so we just gate availability.
 */
const checkFloorCapacity = async (floorId, t) => {
  const total = await ParkingSlot.count({ where: { floorId }, transaction: t });
  if (total === 0) throw new AppError('Tầng này không có slot nào', 400);

  const empty = await ParkingSlot.count({
    where: { floorId, status: 'empty' },
    transaction: t,
  });

  const ratio = empty / total;
  if (ratio < FREE_SLOT_THRESHOLD) {
    throw new AppError(
      `Bãi đang quá tải (còn ${Math.round(ratio * 100)}% trống, cần ≥ ${FREE_SLOT_THRESHOLD * 100}%). Tạm thời không nhận booking.`,
      409
    );
  }
  return { total, empty, ratio };
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

/**
 * Resolve customer fields. Three flows:
 *   - Guest (no requester): body MUST have customerName + customerPhone.
 *   - Logged-in user: auto-fill from profile; body overrides allowed.
 *   - Logged-in resident booking "hộ" (different plate): same as above —
 *     userId = booker, name/phone may differ for the actual driver.
 */
const resolveCustomer = async (body, requester, t) => {
  if (!requester) {
    if (!body.customerName || !body.customerPhone) {
      throw new AppError('Khách vãng lai cần customerName và customerPhone', 400);
    }
    return {
      userId: null,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
    };
  }

  const user = await User.findByPk(requester.id, { transaction: t });
  if (!user) throw new AppError('User not found', 404);

  return {
    userId: user.id,
    customerName: body.customerName?.trim() || user.fullName,
    customerPhone: body.customerPhone?.trim() || user.phone || '',
  };
};

/**
 * Create a booking + VNPay payment URL.
 *
 * Flow:
 *   1. Validate time window (24h advance, ≥1h duration).
 *   2. Pick visitor car floor + check 20% capacity gate.
 *   3. Reject duplicate active booking for the same plate.
 *   4. Compute amount via pricing.service (car hourly + cap + overnight).
 *   5. Insert Booking(status='pending').
 *   6. Hand off to payment.service.createBookingPayment → VNPay URL.
 *
 * After user pays, payment.service.handleBookingOutcome will call our
 * handleBookingPaymentSuccess/Failure exports to flip the booking status.
 */
export const createBooking = async ({ body, requester, ipAddr }) => {
  return sequelize.transaction(async (t) => {
    const plate = normalizePlate(body.licensePlate);
    validateTimeWindow(body.startTime, body.endTime);

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
        slotId: null,                 // booking "ảo" — không lock slot
        userId: customer.userId,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
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
  });
};

// ── Required by payment.service.handleBookingOutcome ────────

/**
 * VNPay confirmed payment → activate booking. Idempotent (no-op if not pending).
 * Must run inside the IPN transaction so booking state matches payment state.
 */
export const handleBookingPaymentSuccess = async (bookingId, t) => {
  const booking = await Booking.findByPk(bookingId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!booking || booking.status !== 'pending') return;
  await booking.update({ status: 'confirmed' }, { transaction: t });
};

/**
 * VNPay confirmed payment failure → cancel booking. Idempotent.
 */
export const handleBookingPaymentFailure = async (bookingId, t) => {
  const booking = await Booking.findByPk(bookingId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!booking || booking.status !== 'pending') return;
  await booking.update({ status: 'cancelled' }, { transaction: t });
};

// ── Helper used by check-in (PR4 — not wired yet) ───────────

/**
 * Find a confirmed booking whose time window covers `now` for this plate.
 * Returns null if no matching booking (caller treats as walk-in).
 *
 * Used by parking-session.checkIn to set session.bookingId + prepaidHours +
 * prepaidAmount + paymentStatus='paid' when the customer shows up.
 */
export const findActiveBookingByPlate = async (licensePlate, t) => {
  const now = new Date();
  return Booking.findOne({
    where: {
      licensePlate: normalizePlate(licensePlate),
      status: 'confirmed',
      startTime: { [Op.lte]: now },
      endTime: { [Op.gte]: now },
      sessionId: null,
    },
    transaction: t,
  });
};

// ── Standard CRUD ───────────────────────────────────────────

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

/**
 * Cancel a booking. Per business rule "hủy booking KHÔNG hoàn tiền".
 * Only the booking owner or staff/admin/manager may cancel.
 */
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

/**
 * Sweep: mark 'expired' for confirmed bookings whose endTime has passed and
 * which never linked to a session (customer no-show). Call from admin
 * endpoint or a scheduled job.
 */
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
