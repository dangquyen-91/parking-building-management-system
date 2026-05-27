import crypto from 'crypto';
import qs from 'qs';
import { vnpayConfig } from '../config/vnpay.config.js';

const sortObject = (obj) => {
  const sorted = {};
  const str = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') {
        str.push(encodeURIComponent(key));
      }
    }
  }

  str.sort();

  for (let i = 0; i < str.length; i++) {
    const encodedKey = str[i];
    const originalKey = decodeURIComponent(encodedKey);
    sorted[encodedKey] = encodeURIComponent(String(obj[originalKey])).replace(/%20/g, '+');
  }

  return sorted;
};

const createSecureHash = (queryString) => {
  if (!vnpayConfig.secretKey) {
    throw new Error('VNPay secret key is not configured (VNPAY_SECRET_KEY)');
  }
  return crypto.createHmac('sha512', vnpayConfig.secretKey).update(queryString, 'utf-8').digest('hex');
};

const pad = (n) => String(n).padStart(2, '0');

const toVNTime = (date = new Date()) => {
  const targetOffsetMinutes = 7 * 60;
  const localOffsetMinutes = -date.getTimezoneOffset();
  const diffMinutes = targetOffsetMinutes - localOffsetMinutes;
  return new Date(date.getTime() + diffMinutes * 60 * 1000);
};

const formatDate = (date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
  `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

export const createPaymentUrl = ({ amount, orderId, orderInfo, orderType = 'other', locale = 'vn', ipAddr, returnUrl }) => {
  const nowVN = toVNTime();
  const createDate = formatDate(nowVN);
  const expireDate = formatDate(new Date(nowVN.getTime() + 15 * 60 * 1000));

  const vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpayConfig.tmnCode,
    vnp_Amount: String(Math.round(Number(amount) * 100)),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Locale: locale,
    vnp_ReturnUrl: returnUrl || vnpayConfig.returnUrl,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  const sortedParams = sortObject(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const secureHash = createSecureHash(signData);
  sortedParams['vnp_SecureHash'] = secureHash;

  const paymentUrl = `${vnpayConfig.vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`;
  return { paymentUrl, createDate };
};

/**
 * Actively query VNPay for a transaction's true status (queryDr). Used for
 * reconciliation when an IPN was missed. Returns VNPay's raw JSON response.
 * `transactionDate` must be the vnp_CreateDate sent at checkout (yyyyMMddHHmmss).
 */
export const queryTransaction = async ({ orderId, transactionDate, ipAddr }) => {
  const requestId = `${Date.now()}`;
  const version = '2.1.0';
  const command = 'querydr';
  const orderInfo = `Query GD ${orderId}`;
  const createDate = formatDate(toVNTime());
  const ip = ipAddr || '127.0.0.1';

  const signData = [
    requestId,
    version,
    command,
    vnpayConfig.tmnCode,
    orderId,
    transactionDate,
    createDate,
    ip,
    orderInfo,
  ].join('|');
  const secureHash = createSecureHash(signData);

  const body = {
    vnp_RequestId: requestId,
    vnp_Version: version,
    vnp_Command: command,
    vnp_TmnCode: vnpayConfig.tmnCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_TransactionDate: transactionDate,
    vnp_CreateDate: createDate,
    vnp_IpAddr: ip,
    vnp_SecureHash: secureHash,
  };

  const resp = await fetch(vnpayConfig.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return resp.json();
};

export const verifyCallback = (params) => {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = params;
  if (!vnp_SecureHash) return false;

  const sortedParams = sortObject(rest);
  const signData = qs.stringify(sortedParams, { encode: false });
  const expected = createSecureHash(signData);

  return expected === String(vnp_SecureHash);
};

export const isSuccessResponse = (responseCode, transactionStatus) =>
  responseCode === '00' && transactionStatus === '00';

const RESPONSE_MESSAGES = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.',
  '12': 'Thẻ/Tài khoản bị khóa.',
  '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP). Xin vui lòng thực hiện lại giao dịch.',
  '24': 'Khách hàng hủy giao dịch',
  '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Nhập sai mật khẩu đăng nhập InternetBanking quá số lần quy định.',
  '99': 'Lỗi không xác định.',
};

export const getResponseMessage = (code) => RESPONSE_MESSAGES[code] || `Mã lỗi: ${code}`;
