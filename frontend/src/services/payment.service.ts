const API_BASE_URL = 'http://localhost:5000/api/v1';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

interface PaymentSubscription {
  id: number;
  licensePlate?: string;
  status?: string;
}

export interface Payment {
  id: number;
  orderId: string;
  provider: string;
  amount: string;
  orderInfo: string | null;
  status: PaymentStatus;
  subscriptionId: number | null;
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
};
