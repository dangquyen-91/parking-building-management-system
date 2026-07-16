const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export type PackageVehicleType = 'motorcycle' | 'car';

export interface ParkingPackage {
  id: number;
  name: string;
  vehicleType: PackageVehicleType;
  durationDays: number;
  price: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackagePayload {
  name: string;
  vehicleType: PackageVehicleType;
  durationDays: number;
  price: number;
  description?: string | null;
  isActive?: boolean;
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

export const packageService = {
  async getPackages(params: { vehicleType?: PackageVehicleType; isActive?: boolean } = {}): Promise<ParkingPackage[]> {
    const query = new URLSearchParams();
    if (params.vehicleType) query.set('vehicleType', params.vehicleType);
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));

    const response = await fetch(`${API_BASE_URL}/packages?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await parseResponse<{ data: ParkingPackage[] }>(response);
    return result.data;
  },

  async createPackage(payload: PackagePayload): Promise<ParkingPackage> {
    const response = await fetch(`${API_BASE_URL}/packages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseResponse<{ data: ParkingPackage }>(response);
    return result.data;
  },

  async updatePackage(id: number, payload: PackagePayload): Promise<ParkingPackage> {
    const response = await fetch(`${API_BASE_URL}/packages/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseResponse<{ data: ParkingPackage }>(response);
    return result.data;
  },

  async deletePackage(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/packages/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await parseResponse<void>(response);
  },
};
