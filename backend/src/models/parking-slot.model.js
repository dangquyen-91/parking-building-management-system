import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const SLOT_STATUSES = ['empty', 'occupied', 'reserved', 'maintenance'];

const ParkingSlot = sequelize.define(
  'ParkingSlot',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    floorId: { type: DataTypes.INTEGER, allowNull: false },
    slotCode: { type: DataTypes.STRING, allowNull: false },
    vehicleType: { type: DataTypes.ENUM('motorcycle', 'car'), allowNull: false },
    status: { type: DataTypes.ENUM(...SLOT_STATUSES), defaultValue: 'empty' },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'parking_slots',
    timestamps: true,
    indexes: [{ unique: true, fields: ['floorId', 'slotCode'] }],
  }
);

export default ParkingSlot;
