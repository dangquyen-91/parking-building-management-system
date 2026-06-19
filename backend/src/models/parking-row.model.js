import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const ROW_STATUSES = ['available', 'full', 'maintenance'];

const ParkingRow = sequelize.define(
  'ParkingRow',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    floorId: { type: DataTypes.INTEGER, allowNull: false },
    rowCode: { type: DataTypes.STRING(20), allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    occupiedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM(...ROW_STATUSES),
      defaultValue: 'available',
    },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'parking_rows',
    timestamps: true,
    indexes: [{ unique: true, fields: ['floorId', 'rowCode'] }],
  }
);

export default ParkingRow;
