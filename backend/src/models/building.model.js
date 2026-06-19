import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Building = sequelize.define(
  'Building',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: 'buildings', timestamps: true }
);

export default Building;
