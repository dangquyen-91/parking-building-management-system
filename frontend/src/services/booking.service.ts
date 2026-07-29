const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired';

export interface BookingCreatePayload {
  licensePlate: string;
  customerEmail: string;
  startTime: string;
  durationHours: number;
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
    floorNumber: string;
  };
}

export interface Booking {
  id: number;
  floorId: number;
  slotId: number | null;
  userId: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
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
    floorNumber: string;
    buildingId: number;
  };
  user?: {
    id: number;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
}

export interface BookingListParams {
  status?: BookingStatus;
  floorId?: number;
  holding?: boolean;
  licensePlate?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface BookingListResult {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExpireBookingsResult {
  pendingCancelled: number;
  expired: number;
}

export interface BookingAvailability {
  floor: { id: number; floorNumber: string };
  total: number;
  activeSessions: number;
  heldByBookings: number;
  available: number;
  minimumFree: number;
  acceptingBookings: boolean;
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
  async getAvailability(): Promise<BookingAvailability> {
    const response = await fetch(`${API_BASE_URL}/bookings/availability`);
    return parseDataResponse<BookingAvailability>(response);
  },

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

  async getAll(params: BookingListParams = {}): Promise<BookingListResult> {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 10));
    if (params.status) query.set('status', params.status);
    if (params.floorId) query.set('floorId', String(params.floorId));
    if (params.holding !== undefined) query.set('holding', String(params.holding));
    if (params.licensePlate) {
      query.set('licensePlate', params.licensePlate.toUpperCase().replace(/\s/g, '').trim());
    }
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    const response = await fetch(`${API_BASE_URL}/bookings?${query.toString()}`, {
      method: 'GET',
      headers: jsonHeaders(true),
    });
    const result = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));
    if (!response.ok || !result.success) {
      throw new Error(result.message || `API error with status ${response.status}`);
    }

    return {
      bookings: result.data as Booking[],
      pagination: result.pagination,
    };
  },

  async cancelBooking(id: number): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: jsonHeaders(true),
    });
    return parseDataResponse<Booking>(response);
  },

  async expireBookings(): Promise<ExpireBookingsResult> {
    const response = await fetch(`${API_BASE_URL}/bookings/expire`, {
      method: 'POST',
      headers: jsonHeaders(true),
    });
    return parseDataResponse<ExpireBookingsResult>(response);
  },
};
