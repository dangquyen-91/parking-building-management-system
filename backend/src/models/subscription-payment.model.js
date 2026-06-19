import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { paymentBaseFields, paymentBaseIndexes } from './_payment-base.js';

const SubscriptionPayment = sequelize.define(
  'SubscriptionPayment',
  {
    ...paymentBaseFields,
    subscriptionId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'subscription_payments',
    timestamps: true,
    indexes: [...paymentBaseIndexes, { fields: ['subscriptionId'] }],
  }
);

export default SubscriptionPayment;
