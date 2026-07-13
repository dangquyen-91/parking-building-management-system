import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const VEHICLE_TYPES = ['motorcycle', 'car'];

const Vehicle = sequelize.define(
  'Vehicle',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    licensePlate: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    vehicleType: { type: DataTypes.ENUM(...VEHICLE_TYPES), allowNull: false },
    nickname: { type: DataTypes.STRING(50), allowNull: true },
  },
  {
    tableName: 'vehicles',
    timestamps: true,
    indexes: [{ fields: ['userId'] }],
  }
);

export default Vehicle;
