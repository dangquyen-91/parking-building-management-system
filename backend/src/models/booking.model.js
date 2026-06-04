import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'expired'];

const Booking = sequelize.define(
  'Booking',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    floorId: { type: DataTypes.INTEGER, allowNull: false },
    slotId: { type: DataTypes.INTEGER, allowNull: true }, // unused — booking is "ảo"
    userId: { type: DataTypes.INTEGER, allowNull: true },
    customerName: { type: DataTypes.STRING(100), allowNull: false },
    customerPhone: { type: DataTypes.STRING(20), allowNull: false },
    licensePlate: { type: DataTypes.STRING(20), allowNull: false },
    vehicleType: { type: DataTypes.ENUM('car'), allowNull: false, defaultValue: 'car' },
    startTime: { type: DataTypes.DATE, allowNull: true },
    endTime: { type: DataTypes.DATE, allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    prepaidHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.ENUM(...BOOKING_STATUSES), defaultValue: 'pending' },
    note: { type: DataTypes.TEXT, allowNull: true },
    staffNote: { type: DataTypes.TEXT, allowNull: true },
    handledBy: { type: DataTypes.INTEGER, allowNull: true },
    handledAt: { type: DataTypes.DATE, allowNull: true },
    sessionId: { type: DataTypes.INTEGER, allowNull: true }, // set by check-in
    // NOTE: DB has an extra `active_plate_lock` STORED generated column added
    // by migration 004 to power the unique-active-plate index. Sequelize does
    // not need to know about it — it's auto-computed by MySQL on every write.
  },
  {
    tableName: 'parking_bookings',
    timestamps: true,
    indexes: [
      { fields: ['licensePlate', 'status'] },
      { fields: ['userId'] },
      { fields: ['floorId'] },
      { fields: ['startTime'] },
    ],
  }
);

export default Booking;
