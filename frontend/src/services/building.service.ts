const API_BASE_URL = 'http://localhost:5000/api/v1';

export interface Building {
  id: number;
  name: string;
  address: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingPayload {
  name: string;
  address: string;
  description?: string | null;
  isActive: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BuildingsResult {
  buildings: Building[];
  pagination: Pagination;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

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

export const buildingService = {
  async getBuildings(params: { search?: string; isActive?: boolean; page?: number; limit?: number } = {}): Promise<BuildingsResult> {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 5));
    if (params.search) query.set('search', params.search);
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));

    const response = await fetch(`${API_BASE_URL}/buildings?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await parseResponse<{ data: Building[]; pagination: Pagination }>(response);
    return { buildings: result.data, pagination: result.pagination };
  },

  async createBuilding(payload: BuildingPayload): Promise<Building> {
    const response = await fetch(`${API_BASE_URL}/buildings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseResponse<{ data: Building }>(response);
    return result.data;
  },

  async updateBuilding(id: number, payload: BuildingPayload): Promise<Building> {
    const response = await fetch(`${API_BASE_URL}/buildings/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseResponse<{ data: Building }>(response);
    return result.data;
  },

  async deleteBuilding(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/buildings/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await parseResponse<void>(response);
  },
};
