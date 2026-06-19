import type { UserProfile } from './auth.service';
import type { ResidentSubscription } from './subscription.service';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export interface MySubscription extends ResidentSubscription {
  package: {
    id: number;
    name: string;
    vehicleType: 'car' | 'motorcycle';
    durationDays: number;
    price: string;
  };
  slot: {
    id: number;
    slotCode: string;
    floorId: number;
    status: string;
  } | null;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
}

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('Vui lòng đăng nhập.');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));
  if (!response.ok || !result.success) {
    throw new Error(result.message || `API error ${response.status}`);
  }
  return result.data as T;
}

export const profileService = {
  async getMe(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/users/me`, { headers: authHeaders() });
    return parseResponse<UserProfile>(res);
  },

  async updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return parseResponse<UserProfile>(res);
  },

  async getMySubscriptions(status?: string): Promise<MySubscription[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const res = await fetch(`${API_BASE_URL}/subscriptions/me?${params.toString()}`, {
      headers: authHeaders(),
    });
    return parseResponse<MySubscription[]>(res);
  },
};
