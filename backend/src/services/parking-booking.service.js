import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import ParkingBooking from '../models/parking-booking.model.js';
import ParkingSession from '../models/parking-session.model.js';
import ParkingSlot from '../models/parking-slot.model.js';
import Floor from '../models/floor.model.js';
import Building from '../models/building.model.js';
import User from '../models/user.model.js';
import ResidentSubscription from '../models/resident-subscription.model.js';
import AppError from '../utils/appError.js';

const ACTIVE_BOOKING_STATUSES = ['pending'];

const normalizePlate = (plate) => plate.toUpperCase().replace(/\s/g, '');

const resolveBookingPeriod = ({ startTime, endTime, durationHours }) => {
  if (!startTime && !endTime && !durationHours) return { startTime: null, endTime: null };

  const start = startTime ? new Date(startTime) : new Date();
  if (Number.isNaN(start.getTime())) throw new AppError('Invalid startTime', 400);
  if (start.getTime() < Date.now() - 60 * 1000) {
    throw new AppError('startTime cannot be in the past', 400);
  }

  let end;
  if (endTime) {
    end = new Date(endTime);
  } else {
    const hours = Number(durationHours) > 0 ? Number(durationHours) : 4;
    end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  }

  if (Number.isNaN(end.getTime()) || end <= start) {
    throw new AppError('endTime must be after startTime', 400);
  }

  return { startTime: start, endTime: end };
};

const bookingInclude = [
  {
    model: Floor,
    as: 'floor',
    required: false,
    attributes: ['id', 'floorNumber', 'floorType', 'vehicleType', 'buildingId'],
    include: [{ model: Building, as: 'building', attributes: ['id', 'name'] }],
  },
  {
    model: ParkingSlot,
    as: 'slot',
    required: false,
    attributes: ['id', 'slotCode', 'floorId', 'status'],
    include: [
      {
        model: Floor,
        as: 'floor',
        attributes: ['id', 'floorNumber', 'floorType', 'vehicleType', 'buildingId'],
        include: [{ model: Building, as: 'building', attributes: ['id', 'name'] }],
      },
    ],
  },
  { model: User, as: 'user', attributes: ['id', 'fullName', 'email'], required: false },
  { model: User, as: 'staff', attributes: ['id', 'fullName'], required: false },
  { model: ParkingSession, as: 'session', attributes: ['id', 'entryTime', 'status'], required: false },
];

const assertVisitorFloor = async (floorId, vehicleType, t) => {
  const floor = await Floor.findByPk(floorId, {
    include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'isActive'] }],
    lock: t?.LOCK.UPDATE,
    transaction: t,
  });
  if (!floor) throw new AppError('Floor not found', 404);
  if (!floor.isActive) throw new AppError('Floor is inactive', 400);
  if (!floor.building.isActive) throw new AppError('Building is inactive', 400);
  if (floor.floorType !== 'visitor') throw new AppError('Residents already have assigned slots. Booking is only for visitors.', 400);
  if (floor.vehicleType !== vehicleType) throw new AppError(`This floor only accepts ${floor.vehicleType}`, 400);
  return floor;
};

const assertNoActiveResidentPackage = async (licensePlate, t) => {
  const activeSub = await ResidentSubscription.findOne({
    where: { licensePlate, status: 'active', endDate: { [Op.gt]: new Date() } },
    transaction: t,
  });
  if (activeSub) throw new AppError('This plate has an active resident package and does not need booking.', 409);
};

const assertPlateAvailable = async (licensePlate, t) => {
  const activeSession = await ParkingSession.findOne({
    where: { licensePlate, status: 'active' },
    transaction: t,
  });
  if (activeSession) throw new AppError(`License plate ${licensePlate} is already checked in`, 409);

  const pendingBooking = await ParkingBooking.findOne({
    where: { licensePlate, status: { [Op.in]: ACTIVE_BOOKING_STATUSES } },
    transaction: t,
  });
  if (pendingBooking) throw new AppError(`License plate ${licensePlate} already has a pending booking`, 409);
};

const findBookableCarSlot = async ({ floorId, slotId }, t) => {
  const where = { floorId, status: 'empty', vehicleType: 'car' };
  if (slotId) where.id = slotId;

  const slot = await ParkingSlot.findOne({
    where,
    include: [{ model: Floor, as: 'floor', attributes: ['id', 'floorType', 'vehicleType', 'isActive'] }],
    order: [['slotCode', 'ASC']],
    lock: t.LOCK.UPDATE,
    transaction: t,
  });
  if (!slot) throw new AppError('No empty visitor car slot is available for booking', 409);
  return slot;
};

const countBookableSlots = async ({ floorId }, t) => {
  const emptySlots = await ParkingSlot.count({
    where: { floorId, vehicleType: 'car', status: 'empty' },
    transaction: t,
  });

  const pendingBookings = await ParkingBooking.count({
    where: { floorId, status: { [Op.in]: ACTIVE_BOOKING_STATUSES } },
    transaction: t,
  });

  return Math.max(0, emptySlots - pendingBookings);
};

const toPublicBooking = (booking, availableSlotsRemaining) => ({
  id: booking.id,
  customerName: booking.customerName,
  customerPhone: booking.customerPhone,
  licensePlate: booking.licensePlate,
  vehicleType: booking.vehicleType,
  status: booking.status,
  note: booking.note,
  startTime: booking.startTime,
  endTime: booking.endTime,
  availableSlotsRemaining,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
});

export const getVisitorAvailability = async () => {
  const floors = await Floor.findAll({
    where: { floorType: 'visitor', isActive: true, vehicleType: 'car' },
    include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'isActive'], where: { isActive: true } }],
    order: [['floorNumber', 'ASC']],
  });

  const availability = [];
  for (const floor of floors) {
    const availableSlots = await countBookableSlots({ floorId: floor.id });
    availability.push({
      floorId: floor.id,
      floorNumber: floor.floorNumber,
      vehicleType: floor.vehicleType,
      building: {
        id: floor.building.id,
        name: floor.building.name,
      },
      availableSlots,
    });
  }

  return availability;
};

export const getMinePublic = async ({ customerPhone, licensePlate }) => {
  const where = { customerPhone: customerPhone.trim() };
  if (licensePlate) where.licensePlate = normalizePlate(licensePlate);

  return ParkingBooking.findAll({
    where,
    include: bookingInclude,
    order: [['createdAt', 'DESC']],
    limit: 20,
  });
};

export const createVisitorBooking = async ({
  floorId,
  customerName,
  customerPhone,
  licensePlate,
  vehicleType,
  startTime,
  endTime,
  durationHours,
  note,
}, userId = null) => {
  const plate = normalizePlate(licensePlate);

  return sequelize.transaction(async (t) => {
    if (vehicleType !== 'car') throw new AppError('Visitor booking currently supports car only', 400);
    await assertVisitorFloor(floorId, vehicleType, t);
    await assertNoActiveResidentPackage(plate, t);
    await assertPlateAvailable(plate, t);

    const availableSlots = await countBookableSlots({ floorId }, t);
    if (availableSlots <= 0) throw new AppError('No visitor car slot is available for booking', 409);

    const period = resolveBookingPeriod({ startTime, endTime, durationHours });
    const booking = await ParkingBooking.create(
      {
        floorId,
        slotId: null,
        userId: userId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        licensePlate: plate,
        vehicleType: 'car',
        startTime: period.startTime,
        endTime: period.endTime,
        status: 'pending',
        note: note?.trim() || null,
      },
      { transaction: t }
    );

    const availableSlotsRemaining = await countBookableSlots({ floorId }, t);
    return toPublicBooking(booking, availableSlotsRemaining);
  });
};

export const getAll = async ({ page = 1, limit = 10, status = 'pending', vehicleType, search } = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (status) where.status = status;
  if (vehicleType) where.vehicleType = vehicleType;
  if (search) {
    where[Op.or] = [
      { licensePlate: { [Op.like]: `%${normalizePlate(search)}%` } },
      { customerName: { [Op.like]: `%${search.trim()}%` } },
      { customerPhone: { [Op.like]: `%${search.trim()}%` } },
    ];
  }

  const { count, rows } = await ParkingBooking.findAndCountAll({
    where,
    include: bookingInclude,
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset,
  });

  return {
    bookings: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      totalPages: Math.ceil(count / limitNum),
    },
  };
};

export const getById = async (id) => {
  const booking = await ParkingBooking.findByPk(id, { include: bookingInclude });
  if (!booking) throw new AppError('Booking not found', 404);
  return booking;
};

export const confirm = async (id, staffId, { staffNote, slotId } = {}) => {
  return sequelize.transaction(async (t) => {
    const booking = await ParkingBooking.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.status !== 'pending') throw new AppError(`Booking is not pending (current: ${booking.status})`, 409);

    await assertNoActiveResidentPackage(booking.licensePlate, t);
    const activeSession = await ParkingSession.findOne({
      where: { licensePlate: booking.licensePlate, status: 'active' },
      transaction: t,
    });
    if (activeSession) throw new AppError(`License plate ${booking.licensePlate} is already checked in`, 409);

    const slot = await findBookableCarSlot({ floorId: booking.floorId, slotId }, t);
    if (!slot) throw new AppError('Reserved slot not found', 404);
    if (!slot.floor?.isActive) throw new AppError('Floor is inactive', 400);
    if (slot.floor.floorType !== 'visitor') throw new AppError('Booking slot must be on a visitor floor', 400);
    if (slot.floor.vehicleType !== 'car') throw new AppError('Booking slot must be for car', 400);
    if (!['reserved', 'empty'].includes(slot.status)) {
      throw new AppError(`Slot is not available (current status: ${slot.status})`, 409);
    }

    const session = await ParkingSession.create(
      {
        slotId: slot.id,
        rowId: null,
        licensePlate: booking.licensePlate,
        vehicleType: booking.vehicleType,
        entryTime: new Date(),
        staffId,
        userId: booking.userId,
        status: 'active',
        note: booking.note || null,
      },
      { transaction: t }
    );

    await slot.update({ status: 'occupied' }, { transaction: t });
    await booking.update(
      { status: 'confirmed', slotId: slot.id, handledBy: staffId, handledAt: new Date(), staffNote: staffNote || null, sessionId: session.id },
      { transaction: t }
    );

    return ParkingBooking.findByPk(id, { include: bookingInclude, transaction: t });
  });
};

const closeBooking = async (id, status, staffId, { staffNote } = {}) => {
  return sequelize.transaction(async (t) => {
    const booking = await ParkingBooking.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.status !== 'pending') throw new AppError(`Booking is not pending (current: ${booking.status})`, 409);

    if (booking.slotId) {
      const slot = await ParkingSlot.findByPk(booking.slotId, { transaction: t, lock: t.LOCK.UPDATE });
      if (slot && slot.status === 'reserved') {
        await slot.update({ status: 'empty' }, { transaction: t });
      }
    }

    await booking.update(
      { status, handledBy: staffId, handledAt: new Date(), staffNote: staffNote || null },
      { transaction: t }
    );
    return ParkingBooking.findByPk(id, { include: bookingInclude, transaction: t });
  });
};

export const reject = (id, staffId, payload) => closeBooking(id, 'rejected', staffId, payload);

export const cancel = (id, staffId, payload) => closeBooking(id, 'cancelled', staffId, payload);
