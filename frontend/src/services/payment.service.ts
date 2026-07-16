const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

interface PaymentSubscription {
  id: number;
  licensePlate?: string;
  vehicleType?: 'car' | 'motorcycle';
  endDate?: string | null;
  status?: string;
}

export interface Payment {
  id: number;
  orderId: string;
  provider: string;
  paymentMethod?: 'cash' | 'vnpay';
  paymentType?: 'subscription' | 'session' | 'booking';
  amount: string;
  orderInfo: string | null;
  status: PaymentStatus;
  subscriptionId: number | null;
  sessionId?: number | null;
  bookingId?: number | null;
  ipAddress: string | null;
  vnpTransactionNo: string | null;
  vnpResponseCode: string | null;
  vnpBankCode: string | null;
  vnpPayDate: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  subscription?: PaymentSubscription | null;
}

export interface PaymentQueryResult {
  orderId: string;
  paid: boolean;
  queryResponseCode: string;
  transactionStatus: string | null;
  message: string;
  paymentStatus: PaymentStatus;
  subscriptionStatus: string | null;
  amount: number;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));
  if (!response.ok || !result.success) {
    throw new Error(result.message || `API error with status ${response.status}`);
  }
  return result as T;
}

function authHeaders() {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('Access token not found');
  }
  return { Authorization: `Bearer ${accessToken}` };
}

export const paymentService = {
  async getByOrderId(orderId: string): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/payments/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await parseResponse<{ data: Payment }>(response);
    return result.data;
  },

  async queryPayment(orderId: string): Promise<PaymentQueryResult> {
    const response = await fetch(`${API_BASE_URL}/payments/${encodeURIComponent(orderId)}/query`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await parseResponse<{ data: PaymentQueryResult }>(response);
    return result.data;
  },
};
