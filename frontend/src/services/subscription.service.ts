const API_BASE_URL = 'http://localhost:5000/api/v1';

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface BuyPackagePayload {
  packageId: number;
  licensePlate: string;
  slotId?: number;
  userId?: number;
}

export interface BuyPackageResult {
  paymentUrl: string;
  orderId: string;
  subscriptionId: number;
  slotId: number | null;
  amount: number;
  isRenewal: boolean;
}

export interface ResidentSubscriptionPackage {
  id: number;
  name: string;
  vehicleType: 'car' | 'motorcycle';
  durationDays: number;
  price: string;
}

export interface ResidentSubscriptionSlot {
  id: number;
  slotCode: string;
  floorId: number;
  status: string;
}

export interface ResidentSubscription {
  id: number;
  userId: number;
  packageId: number;
  slotId: number | null;
  licensePlate: string;
  vehicleType: 'car' | 'motorcycle';
  amount: string;
  startDate: string | null;
  endDate: string | null;
  status: SubscriptionStatus;
  createdAt?: string;
  updatedAt?: string;
  package?: ResidentSubscriptionPackage;
  slot?: ResidentSubscriptionSlot | null;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));
  if (!response.ok || !result.success) {
    throw new Error(result.message || `API error with status ${response.status}`);
  }
  return result.data as T;
}

function authHeaders() {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('Vui lòng đăng nhập trước khi mua gói.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

export const subscriptionService = {
  async buyPackage(payload: BuyPackagePayload): Promise<BuyPackageResult> {
    const response = await fetch(`${API_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        ...payload,
        licensePlate: payload.licensePlate.toUpperCase().trim(),
      }),
    });
    return parseResponse<BuyPackageResult>(response);
  },

  async getById(id: number): Promise<ResidentSubscription> {
    const response = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<ResidentSubscription>(response);
  },

  async getMine(status?: SubscriptionStatus): Promise<ResidentSubscription[]> {
    const query = new URLSearchParams();
    if (status) query.set('status', status);

    const response = await fetch(`${API_BASE_URL}/subscriptions/me?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    return parseResponse<ResidentSubscription[]>(response);
  },
};
