import type {
  LookupApiResponse,
  SubscriptionApiResponse,
  BookingApiItem,
  ParkingSlotApiItem,
  ParkingRowApiItem,
  CheckInPayload,
  CheckInApiResponse,
  ActiveSessionApiItem,
  PaginatedResponse,
  CheckoutPreviewApiResponse,
  CheckOutPayload,
  CheckOutApiResponse,
  FloorApiItem,
} from '../types/kiosk';

const API_BASE_URL = 'http://localhost:5000/api/v1';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  let result: { success: boolean; data?: T; message?: string; pagination?: unknown };

  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  } else {
    result = { success: false, message: await response.text() };
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || `API error with status ${response.status}`
    );
  }

  if (result.pagination !== undefined) {
    return result as unknown as T;
  }

  return result.data as T;
}

export async function lookupVehicle(
  licensePlate: string
): Promise<LookupApiResponse> {
  const plate = licensePlate.toUpperCase().trim();
  const response = await fetch(
    `${API_BASE_URL}/parking-sessions/lookup?licensePlate=${encodeURIComponent(plate)}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<LookupApiResponse>(response);
}

export async function checkActiveSubscription(
  licensePlate: string
): Promise<SubscriptionApiResponse> {
  const plate = licensePlate.toUpperCase().trim();
  const response = await fetch(
    `${API_BASE_URL}/subscriptions/active?licensePlate=${encodeURIComponent(plate)}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<SubscriptionApiResponse>(response);
}

export async function searchBookingsByPlate(
  licensePlate: string
): Promise<PaginatedResponse<BookingApiItem>> {
  const plate = licensePlate.toUpperCase().replace(/\s/g, '').trim();
  const params = new URLSearchParams({
    licensePlate: plate,
    page: '1',
    limit: '10',
  });
  const response = await fetch(
    `${API_BASE_URL}/bookings?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<PaginatedResponse<BookingApiItem>>(response);
}

export async function getAvailableSlots(
  vehicleType: 'car',
  options: { floorId?: number; limit?: number } = {}
): Promise<{ data: ParkingSlotApiItem[] }> {
  const params = new URLSearchParams({
    status: 'empty',
    vehicleType,
    limit: String(options.limit ?? 100),
  });
  if (options.floorId) params.set('floorId', String(options.floorId));
  const response = await fetch(
    `${API_BASE_URL}/parking-slots?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<{ data: ParkingSlotApiItem[] }>(response);
}

export async function getAvailableRows(): Promise<{ data: ParkingRowApiItem[] }> {
  const params = new URLSearchParams({ status: 'available' });
  const response = await fetch(
    `${API_BASE_URL}/parking-rows?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<{ data: ParkingRowApiItem[] }>(response);
}

export async function checkIn(
  payload: CheckInPayload
): Promise<CheckInApiResponse> {
  const response = await fetch(`${API_BASE_URL}/parking-sessions/check-in`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<CheckInApiResponse>(response);
}

export async function getActiveSessions(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<ActiveSessionApiItem>> {
  const query = new URLSearchParams({
    status: 'active',
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 20),
    ...(params?.search ? { search: params.search } : {}),
  });
  const response = await fetch(
    `${API_BASE_URL}/parking-sessions?${query.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<PaginatedResponse<ActiveSessionApiItem>>(response);
}

export async function getCheckoutPreview(
  sessionId: number
): Promise<CheckoutPreviewApiResponse> {
  const response = await fetch(
    `${API_BASE_URL}/parking-sessions/${sessionId}/checkout-preview`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<CheckoutPreviewApiResponse>(response);
}

export async function checkOut(
  sessionId: number,
  payload: CheckOutPayload
): Promise<CheckOutApiResponse> {
  const response = await fetch(
    `${API_BASE_URL}/parking-sessions/${sessionId}/check-out`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<CheckOutApiResponse>(response);
}

export async function getFloors(): Promise<FloorApiItem[]> {
  const response = await fetch(`${API_BASE_URL}/floors`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<FloorApiItem[]>(response);
}

export async function getSlotsByFloor(
  floorId: number
): Promise<{ data: ParkingSlotApiItem[] }> {
  const params = new URLSearchParams({ floorId: String(floorId) });
  const response = await fetch(
    `${API_BASE_URL}/parking-slots?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<{ data: ParkingSlotApiItem[] }>(response);
}

export async function getRowsByFloor(
  floorId: number
): Promise<{ data: ParkingRowApiItem[] }> {
  const params = new URLSearchParams({ floorId: String(floorId) });
  const response = await fetch(
    `${API_BASE_URL}/parking-rows?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<{ data: ParkingRowApiItem[] }>(response);
}
