import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const INCIDENT_TYPES = ['lost_ticket'];

const IncidentReport = sequelize.define(
  'IncidentReport',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.ENUM(...INCIDENT_TYPES), allowNull: false, defaultValue: 'lost_ticket' },
    sessionId: { type: DataTypes.INTEGER, allowNull: true },
    licensePlate: { type: DataTypes.STRING(20), allowNull: false },
    floorId: { type: DataTypes.INTEGER, allowNull: true },
    staffId: { type: DataTypes.INTEGER, allowNull: true },
    penaltyAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    note: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: 'incident_reports',
    timestamps: true,
    indexes: [{ fields: ['type'] }, { fields: ['licensePlate'] }, { fields: ['createdAt'] }],
  }
);

export default IncidentReport;
