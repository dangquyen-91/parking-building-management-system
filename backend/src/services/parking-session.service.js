import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import ParkingSession from '../models/parking-session.model.js';
import ParkingSlot from '../models/parking-slot.model.js';
import Floor from '../models/floor.model.js';
import Building from '../models/building.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';

const checkIn = async ({ slotId, licensePlate, vehicleType, userId, note }, staffId) => {
  return sequelize.transaction(async (t) => {
    const slot = await ParkingSlot.findOne({
      where: { id: slotId },
      include: [
        {
          model: Floor,
          as: 'floor',
          attributes: ['id', 'floorNumber', 'vehicleType', 'isActive', 'buildingId'],
          include: [
            {
              model: Building,
              as: 'building',
              attributes: ['id', 'name', 'isActive'],
            },
          ],
        },
      ],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!slot) throw new AppError('Parking slot not found', 404);
    if (slot.status !== 'empty') throw new AppError(`Slot is not available (current status: ${slot.status})`, 409);
    if (!slot.floor.isActive) throw new AppError('Floor is inactive', 400);
    if (!slot.floor.building.isActive) throw new AppError('Building is inactive', 400);

    if (slot.floor.vehicleType !== vehicleType) {
      throw new AppError(`This slot only accepts ${slot.floor.vehicleType}`, 400);
    }

    const activeSession = await ParkingSession.findOne({
      where: { licensePlate, status: 'active' },
      transaction: t,
    });
    if (activeSession) {
      throw new AppError(`License plate ${licensePlate} is already checked in (session #${activeSession.id})`, 409);
    }

    if (userId) {
      const user = await User.findByPk(userId, { transaction: t });
      if (!user) throw new AppError('User not found', 404);
    }

    const session = await ParkingSession.create(
      {
        slotId,
        licensePlate,
        vehicleType,
        entryTime: new Date(),
        staffId,
        userId: userId || null,
        status: 'active',
        note: note || null,
      },
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
      slot: {
        id: slot.id,
        slotCode: slot.slotCode,
        floor: {
          id: slot.floor.id,
          floorNumber: slot.floor.floorNumber,
          building: {
            id: slot.floor.building.id,
            name: slot.floor.building.name,
          },
        },
      },
      staffId: session.staffId,
      userId: session.userId,
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
  const floorWhere = {};
  if (floorId) slotWhere.floorId = floorId;
  if (buildingId) floorWhere.buildingId = buildingId;

  const { count, rows } = await ParkingSession.findAndCountAll({
    where,
    include: [
      {
        model: ParkingSlot,
        as: 'slot',
        where: Object.keys(slotWhere).length ? slotWhere : undefined,
        attributes: ['id', 'slotCode', 'floorId'],
        include: [
          {
            model: Floor,
            as: 'floor',
            where: Object.keys(floorWhere).length ? floorWhere : undefined,
            attributes: ['id', 'floorNumber', 'buildingId'],
            include: [{ model: Building, as: 'building', attributes: ['id', 'name'] }],
          },
        ],
      },
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
    ParkingSlot.count({ where: { vehicleType: 'motorcycle', status: 'empty' } }),
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

export { checkIn, getActiveSessions, getById, lookup };
