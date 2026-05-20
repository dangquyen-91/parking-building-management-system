import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const SESSION_STATUSES = ['active', 'completed', 'cancelled'];

const ParkingSession = sequelize.define(
  'ParkingSession',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    slotId: { type: DataTypes.INTEGER, allowNull: false },
    licensePlate: { type: DataTypes.STRING, allowNull: false },
    vehicleType: { type: DataTypes.ENUM('motorcycle', 'car'), allowNull: false },
    entryTime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    exitTime: { type: DataTypes.DATE, allowNull: true },
    fee: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    staffId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.ENUM(...SESSION_STATUSES), defaultValue: 'active' },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'parking_sessions',
    timestamps: true,
    indexes: [
      { fields: ['licensePlate', 'status'] },
      { fields: ['slotId', 'status'] },
    ],
  }
);

export default ParkingSession;
