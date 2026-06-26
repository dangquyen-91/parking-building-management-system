import { Op } from 'sequelize';
import { sequelize } from '../config/database.js';
import ResidentSubscription from '../models/resident-subscription.model.js';
import ParkingPackage from '../models/parking-package.model.js';
import ParkingSlot from '../models/parking-slot.model.js';
import ParkingRow from '../models/parking-row.model.js';
import Floor from '../models/floor.model.js';
import SubscriptionPayment from '../models/subscription-payment.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';
import * as vnpayService from './vnpay.service.js';

const PENDING_TTL_MS = 15 * 60 * 1000;

const generateOrderId = () => {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 9).toUpperCase();
  return `SUB-${ts}-${rand}`;
};

const normalizePlate = (plate) => plate.toUpperCase().replace(/\s/g, '');

const ACTIVE_HOLD = ['pending', 'active'];

const reserveCarSlot = async (slotId, plate, t) => {
  if (!slotId) throw new AppError('slotId is required for car packages', 400);

  const slot = await ParkingSlot.findByPk(slotId, {
    include: [{ model: Floor, as: 'floor', attributes: ['id', 'floorType', 'vehicleType', 'isActive'] }],
    lock: t.LOCK.UPDATE,
    transaction: t,
  });

  if (!slot) throw new AppError('Parking slot not found', 404);
  if (slot.vehicleType !== 'car') throw new AppError('Slot is not a car slot', 400);
  if (!slot.floor || slot.floor.floorType !== 'resident') {
    throw new AppError('Packages can only reserve slots on resident floors', 400);
  }

  if (slot.status !== 'empty') {
    const heldBySamePlate = await ResidentSubscription.findOne({
      where: { slotId, licensePlate: plate, status: { [Op.in]: ACTIVE_HOLD } },
      transaction: t,
    });
    if (!heldBySamePlate) {
      throw new AppError(`Slot is not available (current status: ${slot.status})`, 409);
    }
  } else {
    await slot.update({ status: 'reserved' }, { transaction: t });
  }

  return slot;
};

const reserveMotorcycleRow = async (rowId, t) => {
  if (!rowId) throw new AppError('rowId is required for motorcycle packages', 400);

  const row = await ParkingRow.findByPk(rowId, {
    include: [{ model: Floor, as: 'floor', attributes: ['id', 'floorType', 'vehicleType', 'isActive'] }],
    lock: t.LOCK.UPDATE,
    transaction: t,
  });

  if (!row) throw new AppError('Parking row not found', 404);
  if (!row.floor || row.floor.vehicleType !== 'motorcycle') {
    throw new AppError('Row không thuộc tầng xe máy', 400);
  }
  if (!row.floor || row.floor.floorType !== 'resident') {
    throw new AppError('Gói cư dân chỉ có thể đặt row trên tầng cư dân', 400);
  }
  if (row.status === 'maintenance') throw new AppError('Row đang bảo trì', 409);

  const heldCount = await ResidentSubscription.count({
    where: { rowId: row.id, status: { [Op.in]: ACTIVE_HOLD } },
    transaction: t,
  });
  if (heldCount >= row.capacity) {
    throw new AppError(`Row đã đầy (${heldCount}/${row.capacity} chỗ đã đặt)`, 409);
  }

  return row;
};

export const buyPackage = async ({ userId, packageId, licensePlate, slotId, rowId, ipAddr }) => {
  const plate = normalizePlate(licensePlate);

  return sequelize
    .transaction(async (t) => {
      const pkg = await ParkingPackage.findByPk(packageId, { transaction: t });
      if (!pkg || !pkg.isActive) throw new AppError('Package not found or inactive', 404);

      // 1 biển số = 1 sub: chặn nếu plate đang có giao dịch pending (bất kỳ package).
      const existingPending = await ResidentSubscription.findOne({
        where: { licensePlate: plate, status: 'pending' },
        transaction: t,
      });
      if (existingPending) {
        throw new AppError('Biển số này đang có giao dịch chờ thanh toán. Vui lòng hoàn tất hoặc huỷ trước.', 409);
      }

      // Renewal: plate đã có sub active → gia hạn (cộng dồn endDate lúc thanh toán),
      // dùng lại slot cũ, KHÔNG tạo active row thừa.
      const activeSub = await ResidentSubscription.findOne({
        where: { licensePlate: plate, status: 'active', endDate: { [Op.gt]: new Date() } },
        order: [['endDate', 'DESC']],
        transaction: t,
      });
      if (activeSub && activeSub.vehicleType !== pkg.vehicleType) {
        throw new AppError(
          `Biển số đang có gói ${activeSub.vehicleType} active, không thể mua gói ${pkg.vehicleType}.`,
          409
        );
      }
      const isRenewal = !!activeSub;

      let reservedSlotId = null;
      let reservedRowId = null;
      if (pkg.vehicleType === 'car') {
        if (isRenewal) {
          reservedSlotId = activeSub.slotId;
        } else {
          const slot = await reserveCarSlot(slotId, plate, t);
          reservedSlotId = slot.id;
        }
      } else if (pkg.vehicleType === 'motorcycle') {
        if (isRenewal && activeSub.rowId) {
          reservedRowId = activeSub.rowId;
        } else {
          const row = await reserveMotorcycleRow(rowId, t);
          reservedRowId = row.id;
        }
      }

      const subscription = await ResidentSubscription.create(
        {
          userId,
          packageId,
          slotId: reservedSlotId,
          rowId: reservedRowId,
          licensePlate: plate,
          vehicleType: pkg.vehicleType,
          amount: pkg.price,
          status: 'pending',
        },
        { transaction: t }
      );

      const orderId = generateOrderId();
      const orderInfo = `Goi ${pkg.vehicleType} ${plate}`.replace(/[^\x20-\x7E]/g, '');

      const { paymentUrl, createDate } = vnpayService.createPaymentUrl({ amount: pkg.price, orderId, orderInfo, ipAddr });

      await SubscriptionPayment.create(
        {
          orderId,
          provider: 'vnpay',
          paymentMethod: 'vnpay',
          amount: pkg.price,
          orderInfo,
          subscriptionId: subscription.id,
          ipAddress: ipAddr || null,
          vnpCreateDate: createDate,
          status: 'pending',
        },
        { transaction: t }
      );

      return {
        paymentUrl,
        orderId,
        subscriptionId: subscription.id,
        slotId: reservedSlotId,
        rowId: reservedRowId,
        amount: Number(pkg.price),
        isRenewal,
      };
    })
    .catch((err) => {
      if (err?.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Biển số này đang có giao dịch chờ thanh toán. Vui lòng kiểm tra lại.', 409);
      }
      throw err;
    });
};

const baseInclude = [
  { model: ParkingPackage, as: 'package', attributes: ['id', 'name', 'vehicleType', 'durationDays', 'price'] },
  { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
  { model: ParkingSlot, as: 'slot', attributes: ['id', 'slotCode', 'floorId', 'status'] },
  { model: ParkingRow, as: 'row', attributes: ['id', 'rowCode', 'floorId', 'capacity', 'occupiedCount', 'status'] },
];

export const getMine = async (userId, { status } = {}) => {
  const where = { userId };
  if (status) where.status = status;
  return ResidentSubscription.findAll({ where, include: baseInclude, order: [['createdAt', 'DESC']] });
};

export const getAll = async ({ status, licensePlate } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (licensePlate) where.licensePlate = normalizePlate(licensePlate);
  return ResidentSubscription.findAll({ where, include: baseInclude, order: [['createdAt', 'DESC']] });
};

export const getById = async (id, requester) => {
  const sub = await ResidentSubscription.findByPk(id, { include: baseInclude });
  if (!sub) throw new AppError('Subscription not found', 404);
  const privileged = ['admin', 'manager', 'staff'].includes(requester.role);
  if (!privileged && sub.userId !== requester.id) throw new AppError('Access denied', 403);
  return sub;
};

export const getActiveByPlate = async (licensePlate) => {
  const plate = normalizePlate(licensePlate);
  return ResidentSubscription.findOne({
    where: { licensePlate: plate, status: 'active', endDate: { [Op.gt]: new Date() } },
    include: baseInclude,
    order: [['endDate', 'DESC']],
  });
};

const freeSlotIfUnused = async (slotId, excludeSubId, t) => {
  if (!slotId) return;
  const stillHeld = await ResidentSubscription.findOne({
    where: { slotId, status: { [Op.in]: ACTIVE_HOLD }, id: { [Op.ne]: excludeSubId } },
    transaction: t,
  });
  if (stillHeld) return;

  const slot = await ParkingSlot.findByPk(slotId, { lock: t.LOCK.UPDATE, transaction: t });
  if (slot && slot.status === 'reserved') {
    await slot.update({ status: 'empty' }, { transaction: t });
  }
};

export const expireSubscriptions = async () => {
  const now = new Date();
  return sequelize.transaction(async (t) => {
    let pendingCancelled = 0;
    let activeExpired = 0;

    const stalePending = await ResidentSubscription.findAll({
      where: { status: 'pending', createdAt: { [Op.lt]: new Date(now.getTime() - PENDING_TTL_MS) } },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    for (const sub of stalePending) {
      await sub.update({ status: 'cancelled' }, { transaction: t });
      await freeSlotIfUnused(sub.slotId, sub.id, t);
      pendingCancelled += 1;
    }

    const expired = await ResidentSubscription.findAll({
      where: { status: 'active', endDate: { [Op.lt]: now } },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    for (const sub of expired) {
      await sub.update({ status: 'expired' }, { transaction: t });
      await freeSlotIfUnused(sub.slotId, sub.id, t);
      activeExpired += 1;
    }

    const [orphanResult] = await sequelize.query(
      `UPDATE parking_slots SET status = 'empty'
       WHERE status = 'reserved'
         AND id NOT IN (
           SELECT slotId FROM resident_subscriptions
           WHERE slotId IS NOT NULL AND status IN ('pending','active')
         )`,
      { transaction: t }
    );
    const orphanSlotsFreed = orphanResult?.affectedRows ?? 0;

    return { pendingCancelled, activeExpired, orphanSlotsFreed };
  });
};

export { freeSlotIfUnused };
