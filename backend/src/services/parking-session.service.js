import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import ParkingSession from '../models/parking-session.model.js';
import ParkingSlot from '../models/parking-slot.model.js';
import ParkingRow from '../models/parking-row.model.js';
import Floor from '../models/floor.model.js';
import Building from '../models/building.model.js';
import User from '../models/user.model.js';
import ResidentSubscription from '../models/resident-subscription.model.js';
import AppError from '../utils/appError.js';
import { getVisitorFlatFee } from '../constants/pricing.js';

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

const checkIn = async ({ slotId, rowId, licensePlate, vehicleType, userId, note }, staffId) => {
  return sequelize.transaction(async (t) => {
    // ── Kiểm tra biển số chưa có session active ──
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

    if (vehicleType === 'car') {
      const slot = await ParkingSlot.findOne({
        where: { id: slotId },
        include: [
          {
            model: Floor,
            as: 'floor',
            attributes: ['id', 'floorNumber', 'vehicleType', 'floorType', 'isActive', 'buildingId'],
            include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'isActive'] }],
          },
        ],
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!slot) throw new AppError('Parking slot not found', 404);
      if (slot.status !== 'empty') {
        // A car resident may check into a slot reserved by THEIR own active
        // package (matched by license plate). Any other non-empty slot is blocked.
        const ownReservation =
          slot.status === 'reserved'
            ? await ResidentSubscription.findOne({
                where: { slotId, licensePlate, status: 'active', endDate: { [Op.gt]: new Date() } },
                transaction: t,
              })
            : null;
        if (!ownReservation) {
          throw new AppError(`Slot is not available (current status: ${slot.status})`, 409);
        }
        // else: resident entering their own reserved slot — allowed
      }
      if (!slot.floor.isActive) throw new AppError('Floor is inactive', 400);
      if (!slot.floor.building.isActive) throw new AppError('Building is inactive', 400);
      if (slot.floor.vehicleType !== 'car') throw new AppError('This slot only accepts car', 400);

      // ── Validate floorType vs userId ──
      if (slot.floor.floorType === 'resident' && !userId) {
        throw new AppError('This floor is for residents only. userId is required.', 403);
      }
      if (slot.floor.floorType === 'visitor' && userId) {
        throw new AppError('This floor is for visitors only. Do not provide userId.', 403);
      }

      const session = await ParkingSession.create(
        {
          slotId,
          rowId: null,
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
            building: { id: slot.floor.building.id, name: slot.floor.building.name },
          },
        },
        row: null,
        staffId: session.staffId,
        userId: session.userId,
      };
    }

    const row = await ParkingRow.findOne({
      where: { id: rowId },
      include: [
        {
          model: Floor,
          as: 'floor',
          attributes: ['id', 'floorNumber', 'vehicleType', 'floorType', 'isActive', 'buildingId'],
          include: [{ model: Building, as: 'building', attributes: ['id', 'name', 'isActive'] }],
        },
      ],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!row) throw new AppError('Parking row not found', 404);
    if (row.status === 'maintenance') throw new AppError('Row is under maintenance', 409);
    if (row.occupiedCount >= row.capacity) throw new AppError(`Row is full (${row.capacity}/${row.capacity})`, 409);
    if (!row.floor.isActive) throw new AppError('Floor is inactive', 400);
    if (!row.floor.building.isActive) throw new AppError('Building is inactive', 400);
    if (row.floor.vehicleType !== 'motorcycle') throw new AppError('This row only accepts motorcycle', 400);

    // ── Validate floorType vs userId ──
    if (row.floor.floorType === 'resident' && !userId) {
      throw new AppError('This floor is for residents only. userId is required.', 403);
    }
    if (row.floor.floorType === 'visitor' && userId) {
      throw new AppError('This floor is for visitors only. Do not provide userId.', 403);
    }

    const session = await ParkingSession.create(
      {
        slotId: null,
        rowId,
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

    const newOccupied = row.occupiedCount + 1;
    await row.update(
      {
        occupiedCount: newOccupied,
        status: newOccupied >= row.capacity ? 'full' : 'available',
      },
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
      row: {
        id: row.id,
        rowCode: row.rowCode,
        capacity: row.capacity,
        occupiedCount: newOccupied,
        floor: {
          id: row.floor.id,
          floorNumber: row.floor.floorNumber,
          building: { id: row.floor.building.id, name: row.floor.building.name },
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

// ── CHECK-OUT ──────────────────────────────────────────

const findActiveSubByPlate = (licensePlate, t) =>
  ResidentSubscription.findOne({
    where: { licensePlate, status: 'active', endDate: { [Op.gt]: new Date() } },
    order: [['endDate', 'DESC']],
    transaction: t,
  });

/**
 * Determine the fee for a session. Residents on a resident floor with an active
 * subscription are covered (fee 0); everyone else pays the flat visitor fee.
 */
const resolveFee = async (session, floorType, t) => {
  if (floorType === 'resident') {
    const activeSub = await findActiveSubByPlate(session.licensePlate, t);
    if (activeSub) {
      return { fee: 0, covered: true, coveredBy: 'subscription', subscriptionId: activeSub.id };
    }
    // On a resident floor but no valid package → charge as visitor.
    return { fee: getVisitorFlatFee(session.vehicleType), covered: false, coveredBy: null, note: 'no active resident package' };
  }
  return { fee: getVisitorFlatFee(session.vehicleType), covered: false, coveredBy: null };
};

const loadFloorType = async (session, t) => {
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

/**
 * Preview the fee for an active session without completing check-out.
 * Lets staff quote the amount, collect cash, then confirm.
 */
const previewCheckout = async (id) => {
  const session = await ParkingSession.findByPk(id);
  if (!session) throw new AppError('Session not found', 404);
  if (session.status !== 'active') throw new AppError(`Session is not active (current: ${session.status})`, 409);

  const floorType = await loadFloorType(session);
  const { fee, covered, coveredBy } = await resolveFee(session, floorType);

  const now = new Date();
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
    fee,
    paymentMethod: covered ? 'package' : 'cash',
  };
};

/**
 * Complete check-out: mark the session completed, set exit time + fee, and
 * release the spot. A reserved resident slot returns to 'reserved' (still
 * theirs); a visitor slot returns to 'empty'. Motorcycle rows decrement.
 */
const checkOut = async (id) => {
  return sequelize.transaction(async (t) => {
    const session = await ParkingSession.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!session) throw new AppError('Session not found', 404);
    if (session.status !== 'active') {
      throw new AppError(`Session is not active (current: ${session.status})`, 409);
    }

    const floorType = await loadFloorType(session, t);
    const { fee, covered, coveredBy } = await resolveFee(session, floorType, t);

    const exitTime = new Date();
    await session.update({ status: 'completed', exitTime, fee }, { transaction: t });

    // Release the spot
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
      paymentMethod: covered ? 'package' : 'cash',
    };
  });
};

export { checkIn, getActiveSessions, getById, lookup, previewCheckout, checkOut };
