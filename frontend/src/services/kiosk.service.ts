import type {
  LookupApiResponse,
  SubscriptionApiResponse,
  BookingApiItem,
  ParkingSlotApiItem,
  ParkingRowApiItem,
  CheckInPayload,
  CheckInApiResponse,
  ConfirmBookingPayload,
  ActiveSessionApiItem,
  PaginatedResponse,
  CheckoutPreviewApiResponse,
  CheckOutPayload,
  FloorApiItem,
} from '../types/kiosk';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// ─── Shared helpers (mirrors auth.service.ts pattern) ────────────────────────
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

// ─── Lookup ───────────────────────────────────────────────────────────────────
// GET /parking-sessions/lookup?licensePlate=XXX
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

// ─── Subscription ─────────────────────────────────────────────────────────────
// GET /subscriptions/active?licensePlate=XXX
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

// ─── Bookings ─────────────────────────────────────────────────────────────────
// GET /parking-bookings?search=XXX&page=1&limit=5&status=pending
export async function searchPendingBookings(
  licensePlate: string
): Promise<PaginatedResponse<BookingApiItem>> {
  const plate = licensePlate.toUpperCase().trim();
  const params = new URLSearchParams({
    search: plate,
    page: '1',
    limit: '5',
    status: 'pending',
  });
  const response = await fetch(
    `${API_BASE_URL}/parking-bookings?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<PaginatedResponse<BookingApiItem>>(response);
}

// POST /parking-bookings/{id}/confirm
export async function confirmBooking(
  bookingId: number,
  payload: ConfirmBookingPayload
): Promise<BookingApiItem> {
  const response = await fetch(
    `${API_BASE_URL}/parking-bookings/${bookingId}/confirm`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<BookingApiItem>(response);
}

// ─── Slots & Rows (for walk-in picker) ───────────────────────────────────────
// GET /parking-slots?status=empty&vehicleType=car
export async function getAvailableSlots(
  vehicleType: 'car'
): Promise<{ data: ParkingSlotApiItem[] }> {
  const params = new URLSearchParams({ status: 'empty', vehicleType });
  const response = await fetch(
    `${API_BASE_URL}/parking-slots?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<{ data: ParkingSlotApiItem[] }>(response);
}

// GET /parking-rows?status=available
export async function getAvailableRows(): Promise<{ data: ParkingRowApiItem[] }> {
  const params = new URLSearchParams({ status: 'available' });
  const response = await fetch(
    `${API_BASE_URL}/parking-rows?${params.toString()}`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<{ data: ParkingRowApiItem[] }>(response);
}

// ─── Check-In ────────────────────────────────────────────────────────────────
// POST /parking-sessions/check-in
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

// ─── Active Sessions ──────────────────────────────────────────────────────────
// GET /parking-sessions?status=active
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

// ─── Check-Out ────────────────────────────────────────────────────────────────
// GET /parking-sessions/lookup — reuse lookupVehicle, then read activeSession.id
// GET /parking-sessions/{id}/checkout-preview
export async function getCheckoutPreview(
  sessionId: number
): Promise<CheckoutPreviewApiResponse> {
  const response = await fetch(
    `${API_BASE_URL}/parking-sessions/${sessionId}/checkout-preview`,
    { headers: getAuthHeaders() }
  );
  return handleResponse<CheckoutPreviewApiResponse>(response);
}

// POST /parking-sessions/{id}/check-out
export async function checkOut(
  sessionId: number,
  payload: CheckOutPayload
): Promise<ActiveSessionApiItem> {
  const response = await fetch(
    `${API_BASE_URL}/parking-sessions/${sessionId}/check-out`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  return handleResponse<ActiveSessionApiItem>(response);
}

// ─── Parking Map ──────────────────────────────────────────────────────────────
// GET /floors
export async function getFloors(): Promise<FloorApiItem[]> {
  const response = await fetch(`${API_BASE_URL}/floors`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<FloorApiItem[]>(response);
}

// GET /parking-slots?floorId=X
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

// GET /parking-rows?floorId=X
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
