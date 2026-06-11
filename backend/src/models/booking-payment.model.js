import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { paymentBaseFields, paymentBaseIndexes } from './_payment-base.js';

const BookingPayment = sequelize.define(
  'BookingPayment',
  {
    ...paymentBaseFields,
    bookingId: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'booking_payments',
    timestamps: true,
    indexes: [...paymentBaseIndexes, { fields: ['bookingId'] }],
  }
);

export default BookingPayment;
