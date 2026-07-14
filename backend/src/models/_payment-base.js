import { DataTypes } from 'sequelize';

export const PAYMENT_STATUSES = ['pending', 'success', 'failed', 'cancelled'];
export const PAYMENT_PROVIDERS = ['vnpay'];
export const PAYMENT_METHODS = ['cash', 'vnpay'];

export const paymentBaseFields = {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  provider: { type: DataTypes.ENUM(...PAYMENT_PROVIDERS), defaultValue: 'vnpay' },
  paymentMethod: { type: DataTypes.ENUM(...PAYMENT_METHODS), allowNull: false, defaultValue: 'vnpay' },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  orderInfo: { type: DataTypes.STRING(255), allowNull: true },
  status: { type: DataTypes.ENUM(...PAYMENT_STATUSES), defaultValue: 'pending' },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true },
  vnpCreateDate: { type: DataTypes.STRING(14), allowNull: true },
  vnpTransactionNo: { type: DataTypes.STRING(32), allowNull: true },
  vnpResponseCode: { type: DataTypes.STRING(8), allowNull: true },
  vnpBankCode: { type: DataTypes.STRING(32), allowNull: true },
  vnpPayDate: { type: DataTypes.STRING(14), allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  rawReturn: { type: DataTypes.TEXT, allowNull: true },
  rawIpn: { type: DataTypes.TEXT, allowNull: true },
};

export const paymentBaseIndexes = [
  { fields: ['status'] },
  { fields: ['status', 'paidAt'] },
];
