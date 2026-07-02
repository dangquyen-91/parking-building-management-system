const API_BASE_URL = 'http://localhost:5000/api/v1';

export type VehicleType = 'motorcycle' | 'car';
export type FloorType = 'resident' | 'visitor';

export interface FloorBuilding {
  id: number;
  name: string;
  address: string;
}

export interface Floor {
  id: number;
  buildingId: number;
  floorNumber: string;
  vehicleType: VehicleType;
  floorType: FloorType;
  totalSlots: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  building: FloorBuilding;
}

export interface FloorPayload {
  buildingId?: number;
  floorNumber: string;
  vehicleType: VehicleType;
  floorType: FloorType;
  totalSlots: number;
  description?: string | null;
  isActive?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FloorsResult {
  floors: Floor[];
  pagination: Pagination;
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
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

export const floorService = {
  async getFloors(params: {
    buildingId?: number;
    vehicleType?: VehicleType;
    floorType?: FloorType;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<FloorsResult> {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 5));
    if (params.buildingId) query.set('buildingId', String(params.buildingId));
    if (params.vehicleType) query.set('vehicleType', params.vehicleType);
    if (params.floorType) query.set('floorType', params.floorType);
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));

    const response = await fetch(`${API_BASE_URL}/floors?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await parseResponse<{ data: Floor[]; pagination: Pagination }>(response);
    return { floors: result.data, pagination: result.pagination };
  },

  async createFloor(payload: FloorPayload & { buildingId: number }): Promise<Floor> {
    const response = await fetch(`${API_BASE_URL}/floors`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseResponse<{ data: Floor }>(response);
    return result.data;
  },

  async updateFloor(id: number, payload: FloorPayload): Promise<Floor> {
    const { buildingId, ...updatePayload } = payload;
    const response = await fetch(`${API_BASE_URL}/floors/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(updatePayload),
    });
    const result = await parseResponse<{ data: Floor }>(response);
    return result.data;
  },
};
