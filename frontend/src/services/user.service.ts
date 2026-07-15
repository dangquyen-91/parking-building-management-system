import type { UserProfile } from './auth.service';

const API_BASE_URL = 'http://localhost:5000/api/v1';

export type UserRole = UserProfile['role'];
export type AssignableRole = 'user' | 'manager' | 'staff';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersResult {
  users: UserProfile[];
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

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  phone?: string;
}

export const userService = {
  async getUsers(params: { search?: string; role?: UserRole; page?: number; limit?: number } = {}): Promise<UsersResult> {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 50));
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);

    const response = await fetch(`${API_BASE_URL}/users?${query.toString()}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const result = await parseResponse<{ data: UserProfile[]; pagination: Pagination }>(response);
    return { users: result.data, pagination: result.pagination };
  },

  async getUserById(id: number): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await parseResponse<{ data: UserProfile }>(response);
    return result.data;
  },

  async updateUser(id: number, payload: UpdateUserPayload): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await parseResponse<{ data: UserProfile }>(response);
    return result.data;
  },

  async updateRole(userId: number, role: UserRole): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ role }),
    });

    const result = await parseResponse<{ data: UserProfile }>(response);
    return result.data;
  },

  async updateUserStatus(id: number, isActive: boolean): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ isActive }),
    });
    const result = await parseResponse<{ data: UserProfile }>(response);
    return result.data;
  },

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (response.status === 204) return;
    await parseResponse<void>(response);
  },
};
