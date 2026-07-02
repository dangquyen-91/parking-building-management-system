import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const VEHICLE_TYPES = ['motorcycle', 'car'];
export const FLOOR_TYPES   = ['resident', 'visitor'];

const Floor = sequelize.define(
  'Floor',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    buildingId: { type: DataTypes.INTEGER, allowNull: false },
    floorNumber: { type: DataTypes.STRING(20), allowNull: false },
    vehicleType: { type: DataTypes.ENUM(...VEHICLE_TYPES), allowNull: false },
    floorType:   { type: DataTypes.ENUM(...FLOOR_TYPES),   allowNull: false },
    totalSlots: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'floors',
    timestamps: true,
    indexes: [{ unique: true, fields: ['buildingId', 'floorNumber'] }],
  }
);

export default Floor;
