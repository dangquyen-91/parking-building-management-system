import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { paymentBaseFields, paymentBaseIndexes } from './_payment-base.js';

const SessionPayment = sequelize.define(
  'SessionPayment',
  {
    ...paymentBaseFields,
    sessionId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'session_payments',
    timestamps: true,
    indexes: [...paymentBaseIndexes, { fields: ['sessionId'] }],
  }
);

export default SessionPayment;
