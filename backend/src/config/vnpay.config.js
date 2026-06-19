export const vnpayConfig = {
  tmnCode: (process.env.VNPAY_TMN_CODE || '').trim(),
  secretKey: (process.env.VNPAY_SECRET_KEY || '').trim(),
  vnpUrl: (process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html').trim(),
  apiUrl: (process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction').trim(),
  returnUrl: (process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/v1/payments/vnpay/return').trim(),
  ipnUrl: (process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/v1/payments/vnpay/ipn').trim(),
  frontendReturnUrl: (process.env.FRONTEND_PAYMENT_RETURN_URL || 'http://localhost:3000/payment').trim(),
};
