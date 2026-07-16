import type { FloorBuilding } from './floor.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export type ParkingRowStatus = 'available' | 'full' | 'maintenance';

export interface ParkingRow {
  id: number;
  floorId: number;
  rowCode: string;
  capacity: number;
  occupiedCount: number;
  status: ParkingRowStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  floor: {
    id: number;
    floorNumber: string;
    vehicleType: 'motorcycle';
    buildingId: number;
    building: Pick<FloorBuilding, 'id' | 'name'>;
  };
}

export interface ParkingRowPayload {
  floorId?: number;
  rowCode: string;
  capacity: number;
  note?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  if (!accessToken) throw new Error('Access token not found');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };
}

export const parkingRowService = {
  async getRows(params: {
    buildingId?: number;
    floorId?: number;
    status?: ParkingRowStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{ rows: ParkingRow[]; pagination: Pagination }> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    });
    if (params.buildingId) query.set('buildingId', String(params.buildingId));
    if (params.floorId) query.set('floorId', String(params.floorId));
    if (params.status) query.set('status', params.status);

    const response = await fetch(`${API_BASE_URL}/parking-rows?${query.toString()}`, {
      headers: authHeaders(),
    });
    const result = await parseResponse<{ data: ParkingRow[]; pagination: Pagination }>(response);
    return { rows: result.data, pagination: result.pagination };
  },

  async createRow(payload: ParkingRowPayload & { floorId: number }): Promise<ParkingRow> {
    const response = await fetch(`${API_BASE_URL}/parking-rows`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
    });
    return (await parseResponse<{ data: ParkingRow }>(response)).data;
  },

  async updateRow(id: number, payload: Omit<ParkingRowPayload, 'floorId'>): Promise<ParkingRow> {
    const response = await fetch(`${API_BASE_URL}/parking-rows/${id}`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify(payload),
    });
    return (await parseResponse<{ data: ParkingRow }>(response)).data;
  },

  async updateStatus(id: number, status: ParkingRowStatus, note?: string | null): Promise<ParkingRow> {
    const response = await fetch(`${API_BASE_URL}/parking-rows/${id}/status`, {
      method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status, note }),
    });
    return (await parseResponse<{ data: ParkingRow }>(response)).data;
  },
};
