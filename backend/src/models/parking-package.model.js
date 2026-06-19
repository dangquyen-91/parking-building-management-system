import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const PACKAGE_VEHICLE_TYPES = ['motorcycle', 'car'];

const ParkingPackage = sequelize.define(
  'ParkingPackage',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    vehicleType: { type: DataTypes.ENUM(...PACKAGE_VEHICLE_TYPES), allowNull: false },
    durationDays: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'parking_packages',
    timestamps: true,
    indexes: [{ fields: ['vehicleType', 'isActive'] }],
  }
);

export default ParkingPackage;
