const API_BASE_URL = 'http://localhost:5000/api/v1';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'manager' | 'staff' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Handle API response helper
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  let result: any;
  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  } else {
    result = { success: false, message: await response.text() };
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || `API error with status ${response.status}`);
  }

  return result.data as T;
}

export const authService = {
  /**
   * Registers a new user.
   */
  async register(userData: { fullName: string; email: string; password; phone?: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse<any>(response);
  },

  /**
   * Logs in a user and returns tokens.
   */
  async login(credentials: { email: string; password }): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthTokens>(response);
  },

  /**
   * Refreshes the access token using a refresh token.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    return handleResponse<AuthTokens>(response);
  },

  /**
   * Logs out the user on the server.
   */
  async logout(accessToken: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    // Ignore content, check ok status or handle
    if (!response.ok) {
      try {
        const result = await response.json();
        throw new Error(result.message || 'Logout failed');
      } catch (err) {
        throw new Error('Logout failed');
      }
    }
  },

  /**
   * Retrieves the current user's profile info.
   */
  async getProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return handleResponse<UserProfile>(response);
  },
};
