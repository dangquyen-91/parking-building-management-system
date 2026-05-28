import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const SUBSCRIPTION_STATUSES = ['pending', 'active', 'expired', 'cancelled'];

const ResidentSubscription = sequelize.define(
  'ResidentSubscription',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    packageId: { type: DataTypes.INTEGER, allowNull: false },
    slotId: { type: DataTypes.INTEGER, allowNull: true }, // car packages: fixed reserved slot
    licensePlate: { type: DataTypes.STRING(20), allowNull: false },
    vehicleType: { type: DataTypes.ENUM('motorcycle', 'car'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM(...SUBSCRIPTION_STATUSES), defaultValue: 'pending' },
  },
  {
    tableName: 'resident_subscriptions',
    timestamps: true,
    indexes: [
      { fields: ['licensePlate', 'status'] },
      { fields: ['userId'] },
      { fields: ['status', 'endDate'] },
    ],
  }
);

export default ResidentSubscription;
