import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const PAYMENT_STATUSES = ['pending', 'success', 'failed', 'cancelled'];
export const PAYMENT_PROVIDERS = ['vnpay'];

const Payment = sequelize.define(
  'Payment',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderId: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    provider: { type: DataTypes.ENUM(...PAYMENT_PROVIDERS), defaultValue: 'vnpay' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    orderInfo: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.ENUM(...PAYMENT_STATUSES), defaultValue: 'pending' },
    subscriptionId: { type: DataTypes.INTEGER, allowNull: true },
    ipAddress: { type: DataTypes.STRING(45), allowNull: true },
    vnpCreateDate: { type: DataTypes.STRING(14), allowNull: true }, // vnp_CreateDate sent at checkout, used for queryDr
    vnpTransactionNo: { type: DataTypes.STRING(32), allowNull: true },
    vnpResponseCode: { type: DataTypes.STRING(8), allowNull: true },
    vnpBankCode: { type: DataTypes.STRING(32), allowNull: true },
    vnpPayDate: { type: DataTypes.STRING(14), allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    rawReturn: { type: DataTypes.TEXT, allowNull: true },
    rawIpn: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: 'payments',
    timestamps: true,
    indexes: [{ fields: ['status'] }, { fields: ['subscriptionId'] }],
  }
);

export default Payment;
