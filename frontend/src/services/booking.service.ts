const API_BASE_URL = 'http://localhost:5000/api/v1';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired';

export interface BookingCreatePayload {
  licensePlate: string;
  startTime: string;
  endTime: string;
  customerName?: string;
  customerPhone?: string;
  floorId?: number;
  note?: string;
}

export interface BookingCreateResult {
  bookingId: number;
  amount: number;
  prepaidHours: number;
  paymentUrl: string;
  orderId: string;
  breakdown: {
    baseFee: number;
    overnightFee: number;
    totalFee: number;
    durationMinutes: number;
    mode: string;
  };
  floor: {
    id: number;
    floorNumber: number;
  };
}

export interface Booking {
  id: number;
  floorId: number;
  slotId: number | null;
  userId: number | null;
  customerName: string;
  customerPhone: string;
  licensePlate: string;
  vehicleType: 'car';
  startTime: string;
  endTime: string;
  amount: string;
  prepaidHours: number;
  status: BookingStatus;
  note: string | null;
  staffNote: string | null;
  handledBy: number | null;
  handledAt: string | null;
  sessionId: number | null;
  createdAt: string;
  updatedAt: string;
  floor?: {
    id: number;
    floorNumber: number;
    buildingId: number;
  };
}

async function parseDataResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));
  if (!response.ok || !result.success) {
    throw new Error(result.message || `API error with status ${response.status}`);
  }
  return result.data as T;
}

function jsonHeaders(requireAuth = false) {
  const accessToken = localStorage.getItem('accessToken');
  if (requireAuth && !accessToken) {
    throw new Error('Vui lòng đăng nhập để xem đặt chỗ của bạn.');
  }

  return {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export const bookingService = {
  async createBooking(payload: BookingCreatePayload): Promise<BookingCreateResult> {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: jsonHeaders(false),
      body: JSON.stringify({
        ...payload,
        licensePlate: payload.licensePlate.toUpperCase().replace(/\s/g, '').trim(),
      }),
    });
    return parseDataResponse<BookingCreateResult>(response);
  },

  async getMine(): Promise<Booking[]> {
    const response = await fetch(`${API_BASE_URL}/bookings/me`, {
      method: 'GET',
      headers: jsonHeaders(true),
    });
    return parseDataResponse<Booking[]>(response);
  },

  async cancelBooking(id: number): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: jsonHeaders(true),
    });
    return parseDataResponse<Booking>(response);
  },
};
