import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import ParkingSession from '../models/parking-session.model.js';
import ParkingSlot from '../models/parking-slot.model.js';
import ParkingRow from '../models/parking-row.model.js';
import Floor from '../models/floor.model.js';
import Building from '../models/building.model.js';
import User from '../models/user.model.js';
import ResidentSubscription from '../models/resident-subscription.model.js';
import SessionPayment from '../models/session-payment.model.js';
import AppError from '../utils/appError.js';
import { calculateFee, calculateExcessFee } from './pricing.service.js';
import * as vnpayService from './vnpay.service.js';

const slotInclude = (slotWhere, floorWhere) => ({
  model: ParkingSlot,
  as: 'slot',
  required: false,
  where: slotWhere && Object.keys(slotWhere).length ? slotWhere : undefined,
  attributes: ['id', 'slotCode', 'floorId'],
  include: [
    {
      model: Floor,
      as: 'floor',
      required: false,
      where: floorWhere && Object.keys(floorWhere).length ? floorWhere : undefined,
      attributes: ['id', 'floorNumber', 'buildingId'],
      include: [{ model: Building, as: 'building', attributes: ['id', 'name'] }],
    },
  ],
});

const rowInclude = (rowWhere, floorWhere) => ({
  model: ParkingRow,
  as: 'row',
  required: false,
  where: rowWhere && Object.keys(rowWhere).length ? rowWhere : undefined,
  attributes: ['id', 'rowCode', 'floorId', 'capacity', 'occupiedCount'],
  include: [
    {
      model: Floor,
      as: 'floor',
      required: false,
      where: floorWhere && Object.keys(floorWhere).length ? floorWhere : undefined,
      attributes: ['id', 'floorNumber', 'buildingId'],
      include: [{ model: Building, as: 'building', attributes: ['id', 'name'] }],
    },
  ],
});

const findActiveBooking = async (licensePlate, t) => {
  const { findActiveBookingByPlate } = await import('./booking.service.js');
  const found = await findActiveBookingByPlate(licensePlate, t);
  if (!found) return null;
  const Booking = (await import('../models/booking.model.js')).default;
  const booking = await Booking.findByPk(found.id, { transaction: t, lock: t.LOCK.UPDATE });
  if (!booking || booking.sessionId) return null;
  return booking;
};

const buildFloorOut = (floor) => ({
  id: floor.id,
  floorNumber: floor.floorNumber,
  building: floor.building ? { id: floor.building.id, name: floor.building.name } : null,
});

const checkIn = async ({ floorId, rowId, licensePlate, vehicleType, userId, note }, staffId) => {
  return sequelize.transaction(async (t) => {
    const activeSession = await ParkingSession.findOne({
      where: { licensePlate, status: 'active' },
      transaction: t,
    });
    if (activeSession) {
      throw new AppError(`License plate ${licensePlate} is already checked in (session #${activeSession.id})`, 409);
    }

    const activeSub = await ResidentSubscription.findOne({
      where: { licensePlate, vehicleType, status: 'active', endDate: { [Op.gt]: new Date() } },
      order: [['endDate', 'DESC']],
      transaction: t,
    });

    // Lock the floor row so the visitor-car counter and motorcycle row picks
    // are serialized across concurrent check-ins on the same floor.
    const floor = await Floor.findByPk(floorId, {
      include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'isActive'] }],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!floor) throw new AppError('Floor not found', 404);
    if (!floor.isActive) throw new AppError('Floor is inactive', 400);
    if (!floor.building.isActive) throw new AppError('Building is inactive', 400);
    if (floor.vehicleType !== vehicleType) {
      throw new AppError(`Tầng này chỉ nhận ${floor.vehicleType}, không phải ${vehicleType}`, 400);
    }

    // Floor-type gate (sub-aware), áp dụng cho cả car + motorcycle.
    if (floor.floorType === 'resident') {
      if (!activeSub) {
        throw new AppError(
          'Tầng cư dân yêu cầu plate có gói (subscription) đang hoạt động. Vui lòng chọn tầng vãng lai.',
          403
        );
      }
    } else if (floor.floorType === 'visitor' && activeSub) {
      throw new AppError(
        `Plate này có gói cư dân (sub #${activeSub.id}) đang hoạt động. Vui lòng vào tầng cư dân, không được dùng tầng vãng lai.`,
        403
      );
    }

    const baseSession = {
      licensePlate,
      vehicleType,
      floorId: floor.id,
      entryTime: new Date(),
      staffId,
      status: 'active',
      note: note || null,
    };

    // ── CAR ──────────────────────────────────────────────
    if (vehicleType === 'car') {
      // Resident car: vào đúng slot cố định của gói.
      if (floor.floorType === 'resident') {
        if (!activeSub.slotId) {
          throw new AppError('Gói cư dân ô tô chưa gắn slot. Liên hệ admin.', 409);
        }
        const slot = await ParkingSlot.findByPk(activeSub.slotId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!slot || slot.floorId !== floor.id) {
          throw new AppError(`Slot của gói (slotId=${activeSub.slotId}) không thuộc tầng này.`, 400);
        }
        const effectiveUserId = activeSub.userId || userId || null;
        const session = await ParkingSession.create(
          { ...baseSession, slotId: slot.id, rowId: null, userId: effectiveUserId },
          { transaction: t }
        );
        await slot.update({ status: 'occupied' }, { transaction: t });
        return {
          id: session.id,
          licensePlate: session.licensePlate,
          vehicleType: session.vehicleType,
          entryTime: session.entryTime,
          status: session.status,
          note: session.note,
          slot: { id: slot.id, slotCode: slot.slotCode },
          row: null,
          floor: buildFloorOut(floor),
          staffId: session.staffId,
          userId: session.userId,
          paymentStatus: 'unpaid',
        };
      }

      // Visitor car: counter theo tầng (không lock slot vật lý).
      const activeCount = await ParkingSession.count({
        where: { floorId: floor.id, status: 'active' },
        transaction: t,
      });
      if (activeCount >= floor.totalSlots) {
        throw new AppError(`Tầng đã đầy (${activeCount}/${floor.totalSlots}).`, 409);
      }

      const activeBooking = await findActiveBooking(licensePlate, t);
      const effectiveUserId = activeBooking?.userId || userId || null;
      if (effectiveUserId) {
        const user = await User.findByPk(effectiveUserId, { transaction: t });
        if (!user) throw new AppError('User not found', 404);
      }

      const payload = { ...baseSession, slotId: null, rowId: null, userId: effectiveUserId };
      if (activeBooking) {
        payload.bookingId = activeBooking.id;
        payload.prepaidHours = activeBooking.prepaidHours;
        payload.prepaidAmount = activeBooking.amount;
        payload.paymentStatus = 'paid';
      }
      const session = await ParkingSession.create(payload, { transaction: t });
      if (activeBooking) {
        await activeBooking.update({ sessionId: session.id }, { transaction: t });
      }

      return {
        id: session.id,
        licensePlate: session.licensePlate,
        vehicleType: session.vehicleType,
        entryTime: session.entryTime,
        status: session.status,
        note: session.note,
        slot: null,
        row: null,
        floor: buildFloorOut(floor),
        occupancy: { used: activeCount + 1, total: floor.totalSlots },
        staffId: session.staffId,
        userId: session.userId,
        bookingId: session.bookingId || null,
        prepaidHours: session.prepaidHours || null,
        prepaidAmount: session.prepaidAmount ? Number(session.prepaidAmount) : null,
        paymentStatus: session.paymentStatus,
      };
    }

    // ── MOTORCYCLE ───────────────────────────────────────
    // Ưu tiên: row cố định từ subscription → rowId truyền vào → auto-pick.
    const effectiveRowId = activeSub?.rowId || rowId;
    let row;
    if (effectiveRowId) {
      row = await ParkingRow.findByPk(effectiveRowId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!row || row.floorId !== floor.id) {
        throw new AppError(
          activeSub?.rowId ? `Row của gói (rowId=${effectiveRowId}) không thuộc tầng này.` : 'Row không thuộc tầng này',
          400
        );
      }
      if (row.status === 'maintenance') throw new AppError('Row đang bảo trì', 409);
      if (row.occupiedCount >= row.capacity) throw new AppError(`Row đã đầy (${row.capacity}/${row.capacity})`, 409);
    } else {
      row = await ParkingRow.findOne({
        where: {
          floorId: floor.id,
          status: 'available',
          occupiedCount: { [Op.lt]: sequelize.col('capacity') },
        },
        order: [['id', 'ASC']],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!row) throw new AppError('Tầng đã đầy, không còn hàng trống', 409);
    }

    const effectiveUserId = activeSub?.userId || userId || null;
    if (effectiveUserId) {
      const user = await User.findByPk(effectiveUserId, { transaction: t });
      if (!user) throw new AppError('User not found', 404);
    }

    const session = await ParkingSession.create(
      { ...baseSession, slotId: null, rowId: row.id, userId: effectiveUserId },
      { transaction: t }
    );

    const newOccupied = row.occupiedCount + 1;
    await row.update(
      { occupiedCount: newOccupied, status: newOccupied >= row.capacity ? 'full' : 'available' },
      { transaction: t }
    );

    return {
      id: session.id,
      licensePlate: session.licensePlate,
      vehicleType: session.vehicleType,
      entryTime: session.entryTime,
      status: session.status,
      note: session.note,
      slot: null,
      row: { id: row.id, rowCode: row.rowCode, capacity: row.capacity, occupiedCount: newOccupied },
      floor: buildFloorOut(floor),
      staffId: session.staffId,
      userId: session.userId,
      paymentStatus: session.paymentStatus,
    };
  });
};

const getActiveSessions = async ({ page = 1, limit = 10, floorId, buildingId, vehicleType, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = { status: 'active' };
  if (vehicleType) where.vehicleType = vehicleType;
  if (search) where.licensePlate = { [Op.like]: `%${search}%` };

  const slotWhere = {};
  const rowWhere = {};
  const floorWhere = {};
  if (floorId) {
    slotWhere.floorId = floorId;
    rowWhere.floorId = floorId;
  }
  if (buildingId) floorWhere.buildingId = buildingId;

  const { count, rows } = await ParkingSession.findAndCountAll({
    where,
    include: [
      slotInclude(slotWhere, floorWhere),
      rowInclude(rowWhere, floorWhere),
      { model: User, as: 'staff', attributes: ['id', 'fullName'] },
    ],
    order: [['entryTime', 'DESC']],
    limit: limitNum,
    offset,
  });

  return {
    sessions: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum),
    },
  };
};

const getById = async (id) => {
  const session = await ParkingSession.findByPk(id, {
    include: [
      {
        model: ParkingSlot,
        as: 'slot',
        required: false,
        attributes: ['id', 'slotCode', 'floorId'],
        include: [
          {
            model: Floor,
            as: 'floor',
            attributes: ['id', 'floorNumber', 'buildingId'],
            include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'address'] }],
          },
        ],
      },
      {
        model: ParkingRow,
        as: 'row',
        required: false,
        attributes: ['id', 'rowCode', 'floorId', 'capacity', 'occupiedCount'],
        include: [
          {
            model: Floor,
            as: 'floor',
            attributes: ['id', 'floorNumber', 'buildingId'],
            include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'address'] }],
          },
        ],
      },
      { model: User, as: 'staff', attributes: ['id', 'fullName'] },
      { model: User, as: 'user', attributes: ['id', 'fullName', 'phone'] },
    ],
  });
  if (!session) throw new AppError('Session not found', 404);
  return session;
};

const lookup = async (licensePlate) => {
  const normalizedPlate = licensePlate.toUpperCase().replace(/\s/g, '');

  const activeSession = await ParkingSession.findOne({
    where: { licensePlate: normalizedPlate, status: 'active' },
    include: [
      {
        model: ParkingSlot,
        as: 'slot',
        required: false,
        attributes: ['id', 'slotCode', 'floorId'],
        include: [
          {
            model: Floor,
            as: 'floor',
            attributes: ['id', 'floorNumber', 'buildingId'],
            include: [{ model: Building, as: 'building', attributes: ['id', 'name'] }],
          },
        ],
      },
      {
        model: ParkingRow,
        as: 'row',
        required: false,
        attributes: ['id', 'rowCode', 'floorId', 'capacity', 'occupiedCount'],
        include: [
          {
            model: Floor,
            as: 'floor',
            attributes: ['id', 'floorNumber', 'buildingId'],
            include: [{ model: Building, as: 'building', attributes: ['id', 'name'] }],
          },
        ],
      },
      { model: User, as: 'staff', attributes: ['id', 'fullName'] },
      { model: User, as: 'user', attributes: ['id', 'fullName', 'phone'] },
    ],
  });

  const lastSession = await ParkingSession.findOne({
    where: {
      licensePlate: normalizedPlate,
      status: { [Op.in]: ['completed', 'cancelled'] },
    },
    order: [['exitTime', 'DESC']],
    attributes: ['id', 'vehicleType', 'entryTime', 'exitTime', 'fee', 'userId'],
    include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'phone', 'email'] }],
  });

  const [availableMotorcycle, availableCar] = await Promise.all([
    ParkingRow.sum('capacity', { where: { status: 'available' } }).then(async (totalCap) => {
      const occupied = await ParkingRow.sum('occupiedCount') || 0;
      const cap = totalCap || 0;
      return Math.max(0, cap - occupied);
    }),
    ParkingSlot.count({ where: { vehicleType: 'car', status: 'empty' } }),
  ]);

  return {
    licensePlate: normalizedPlate,
    status: activeSession ? 'already_active' : 'available',
    activeSession: activeSession || null,
    hint: {
      linkedResident: lastSession?.user || null,
      lastVisit: lastSession
        ? {
            vehicleType: lastSession.vehicleType,
            entryTime: lastSession.entryTime,
            exitTime: lastSession.exitTime,
            fee: lastSession.fee,
          }
        : null,
    },
    availableSlots: {
      motorcycle: availableMotorcycle,
      car: availableCar,
    },
  };
};

const findActiveSubByPlate = (licensePlate, t) =>
  ResidentSubscription.findOne({
    where: { licensePlate, status: 'active', endDate: { [Op.gt]: new Date() } },
    order: [['endDate', 'DESC']],
    transaction: t,
  });

const loadFloorType = async (session, t) => {
  if (session.floorId) {
    const floor = await Floor.findByPk(session.floorId, {
      attributes: ['id', 'floorType'],
      transaction: t,
    });
    if (floor) return floor.floorType;
  }
  // Fallback for legacy sessions created before floorId existed.
  if (session.slotId) {
    const slot = await ParkingSlot.findByPk(session.slotId, {
      include: [{ model: Floor, as: 'floor', attributes: ['id', 'floorType'] }],
      transaction: t,
    });
    return slot?.floor?.floorType || null;
  }
  if (session.rowId) {
    const row = await ParkingRow.findByPk(session.rowId, {
      include: [{ model: Floor, as: 'floor', attributes: ['id', 'floorType'] }],
      transaction: t,
    });
    return row?.floor?.floorType || null;
  }
  return null;
};

const resolveFee = async (session, floorType, t, exitTime = new Date()) => {
  if (floorType === 'resident') {
    const activeSub = await findActiveSubByPlate(session.licensePlate, t);
    if (activeSub) {
      return {
        fee: 0,
        covered: true,
        coveredBy: 'subscription',
        subscriptionId: activeSub.id,
        breakdown: null,
      };
    }
  }

  if (session.bookingId && session.prepaidHours) {
    const excess = calculateExcessFee(session.entryTime, exitTime, session.vehicleType, session.prepaidHours);
    return {
      fee: excess.totalFee,
      covered: excess.totalFee === 0,
      coveredBy: excess.totalFee === 0 ? 'booking' : null,
      breakdown: excess,
    };
  }

  const fee = calculateFee(session.entryTime, exitTime, session.vehicleType);
  return {
    fee: fee.totalFee,
    covered: false,
    coveredBy: null,
    breakdown: fee,
  };
};

const releaseSpot = async (session, t, exitTime) => {
  if (session.slotId) {
    const stillReserved = await ResidentSubscription.findOne({
      where: { slotId: session.slotId, status: 'active', endDate: { [Op.gt]: exitTime } },
      transaction: t,
    });
    await ParkingSlot.update(
      { status: stillReserved ? 'reserved' : 'empty' },
      { where: { id: session.slotId }, transaction: t }
    );
  } else if (session.rowId) {
    const row = await ParkingRow.findByPk(session.rowId, { transaction: t, lock: t.LOCK.UPDATE });
    if (row) {
      const newCount = Math.max(0, row.occupiedCount - 1);
      const newStatus = row.status === 'maintenance' ? 'maintenance' : newCount >= row.capacity ? 'full' : 'available';
      await row.update({ occupiedCount: newCount, status: newStatus }, { transaction: t });
    }
  }
};

const generateSessionOrderId = () => {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 9).toUpperCase();
  return `SESS-${ts}-${rand}`;
};

const previewCheckout = async (id) => {
  const session = await ParkingSession.findByPk(id);
  if (!session) throw new AppError('Session not found', 404);
  if (session.status !== 'active') throw new AppError(`Session is not active (current: ${session.status})`, 409);

  const floorType = await loadFloorType(session);
  const now = new Date();
  const { fee, covered, coveredBy, breakdown } = await resolveFee(session, floorType, null, now);
  const durationMinutes = Math.max(0, Math.round((now - new Date(session.entryTime)) / 60000));

  return {
    sessionId: session.id,
    licensePlate: session.licensePlate,
    vehicleType: session.vehicleType,
    entryTime: session.entryTime,
    now,
    durationMinutes,
    floorType,
    covered,
    coveredBy,
    prepaidHours: session.prepaidHours,
    prepaidAmount: session.prepaidAmount ? Number(session.prepaidAmount) : null,
    fee,
    breakdown,
    suggestedPaymentMethod: covered ? 'package' : 'cash_or_vnpay',
  };
};

const checkOutCash = async (id, staffId) => {
  return sequelize.transaction(async (t) => {
    const session = await ParkingSession.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!session) throw new AppError('Session not found', 404);
    if (session.status !== 'active') {
      throw new AppError(`Session is not active (current: ${session.status})`, 409);
    }

    const floorType = await loadFloorType(session, t);
    const exitTime = new Date();
    const { fee, covered, coveredBy, breakdown } = await resolveFee(session, floorType, t, exitTime);

    await session.update(
      { status: 'completed', exitTime, fee, paymentStatus: 'paid' },
      { transaction: t }
    );

    await releaseSpot(session, t, exitTime);

    let payment = null;
    if (!(covered && coveredBy === 'subscription')) {
      payment = await SessionPayment.create(
        {
          orderId: generateSessionOrderId(),
          provider: 'vnpay',
          paymentMethod: 'cash',
          amount: fee,
          orderInfo: `Phi gui xe ${session.vehicleType} ${session.licensePlate}`.replace(/[^\x20-\x7E]/g, ''),
          status: 'success',
          sessionId: session.id,
          paidAt: exitTime,
        },
        { transaction: t }
      );
    }

    const durationMinutes = Math.max(0, Math.round((exitTime - new Date(session.entryTime)) / 60000));

    return {
      sessionId: session.id,
      licensePlate: session.licensePlate,
      vehicleType: session.vehicleType,
      entryTime: session.entryTime,
      exitTime,
      durationMinutes,
      fee,
      covered,
      coveredBy,
      paymentMethod: 'cash',
      paymentId: payment?.id || null,
      breakdown,
    };
  });
};

const checkOutVnpay = async (id, staffId, ipAddr) => {
  return sequelize.transaction(async (t) => {
    const session = await ParkingSession.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!session) throw new AppError('Session not found', 404);
    if (session.status !== 'active') {
      throw new AppError(`Session is not active (current: ${session.status})`, 409);
    }

    const floorType = await loadFloorType(session, t);
    const { fee, covered, coveredBy, breakdown } = await resolveFee(session, floorType, t, new Date());

    if (fee === 0) {
      const exitTime = new Date();
      await session.update(
        { status: 'completed', exitTime, fee: 0, paymentStatus: 'paid' },
        { transaction: t }
      );
      await releaseSpot(session, t, exitTime);

      return {
        sessionId: session.id,
        licensePlate: session.licensePlate,
        vehicleType: session.vehicleType,
        entryTime: session.entryTime,
        exitTime,
        durationMinutes: Math.max(0, Math.round((exitTime - new Date(session.entryTime)) / 60000)),
        fee: 0,
        covered,
        coveredBy,
        paymentMethod: 'package',
        paymentUrl: null,
        orderId: null,
        breakdown,
      };
    }

    await SessionPayment.update(
      { status: 'cancelled' },
      { where: { sessionId: session.id, status: 'pending' }, transaction: t }
    );

    const orderId = generateSessionOrderId();
    const orderInfo = `Phi gui xe ${session.vehicleType} ${session.licensePlate}`.replace(/[^\x20-\x7E]/g, '');
    const { paymentUrl, createDate } = vnpayService.createPaymentUrl({
      amount: fee,
      orderId,
      orderInfo,
      ipAddr,
    });

    await SessionPayment.create(
      {
        orderId,
        provider: 'vnpay',
        paymentMethod: 'vnpay',
        amount: fee,
        orderInfo,
        status: 'pending',
        sessionId: session.id,
        ipAddress: ipAddr || null,
        vnpCreateDate: createDate,
      },
      { transaction: t }
    );

    return {
      sessionId: session.id,
      licensePlate: session.licensePlate,
      vehicleType: session.vehicleType,
      entryTime: session.entryTime,
      exitTime: null,
      fee,
      covered: false,
      coveredBy: null,
      paymentMethod: 'vnpay',
      paymentUrl,
      orderId,
      breakdown,
    };
  });
};

const finalizeSessionPayment = async (sessionId, amount, t) => {
  const session = await ParkingSession.findByPk(sessionId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!session) return { closed: false, reason: 'session_not_found' };
  if (session.status !== 'active') return { closed: false, reason: 'session_not_active' };

  const exitTime = new Date();
  await session.update(
    { status: 'completed', exitTime, fee: amount, paymentStatus: 'paid' },
    { transaction: t }
  );
  await releaseSpot(session, t, exitTime);
  return { closed: true, sessionId, exitTime };
};

export {
  checkIn,
  getActiveSessions,
  getById,
  lookup,
  previewCheckout,
  checkOutCash,
  checkOutVnpay,
  finalizeSessionPayment,
};
