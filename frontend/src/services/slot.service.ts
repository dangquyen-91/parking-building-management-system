import type { FloorBuilding, VehicleType } from './floor.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export type SlotStatus = 'empty' | 'occupied' | 'reserved' | 'maintenance';

interface SlotFloor {
  id: number;
  floorNumber: string;
  vehicleType: VehicleType;
  buildingId: number;
  building: Pick<FloorBuilding, 'id' | 'name'>;
}

export interface ParkingSlot {
  id: number;
  floorId: number;
  slotCode: string;
  vehicleType: VehicleType;
  status: SlotStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  floor: SlotFloor;
}

export interface SlotPayload {
  floorId?: number;
  slotCode: string;
  vehicleType: 'car';
  status?: SlotStatus;
  note?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SlotsResult {
  slots: ParkingSlot[];
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

export const slotService = {
  async getSlots(params: {
    buildingId?: number;
    floorId?: number;
    vehicleType?: VehicleType;
    status?: SlotStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<SlotsResult> {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 5));
    if (params.buildingId) query.set('buildingId', String(params.buildingId));
    if (params.floorId) query.set('floorId', String(params.floorId));
    if (params.vehicleType) query.set('vehicleType', params.vehicleType);
    if (params.status) query.set('status', params.status);

    const response = await fetch(`${API_BASE_URL}/parking-slots?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await parseResponse<{ data: ParkingSlot[]; pagination: Pagination }>(response);
    return { slots: result.data, pagination: result.pagination };
  },

  async createSlot(payload: SlotPayload & { floorId: number }): Promise<ParkingSlot> {
    const response = await fetch(`${API_BASE_URL}/parking-slots`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseResponse<{ data: ParkingSlot }>(response);
    return result.data;
  },

  async updateSlot(id: number, payload: SlotPayload): Promise<ParkingSlot> {
    const { floorId, ...updatePayload } = payload;
    const response = await fetch(`${API_BASE_URL}/parking-slots/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(updatePayload),
    });
    const result = await parseResponse<{ data: ParkingSlot }>(response);
    return result.data;
  },

  async deleteSlot(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/parking-slots/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({ message: 'Invalid server response' }));
      throw new Error(result.message || `API error with status ${response.status}`);
    }
  },
};
