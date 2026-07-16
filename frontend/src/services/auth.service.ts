const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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


async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  let result: any;
  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  } else {
    result = { success: false, message: await response.text() };
  }

  if (!response.ok || !result.success) {
    const error = new Error(result.message || `API error with status ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return result.data as T;
}

export const authService = {
  
  async register(userData: { fullName: string; email: string; password: string; phone?: string }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse<any>(response);
  },

  
  async login(credentials: { email: string; password: string }): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthTokens>(response);
  },

  
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

  
  async logout(accessToken: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      try {
        const result = await response.json();
        throw new Error(result.message || 'Logout failed');
      } catch (err) {
        throw new Error('Logout failed');
      }
    }
  },

  
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`);
    return handleResponse<{ message: string }>(response);
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<{ message: string }>(response);
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<{ message: string }>(response);
  },

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword, confirmPassword }),
    });
    return handleResponse<{ message: string }>(response);
  },

  async getProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return handleResponse<UserProfile>(response);
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<AuthTokens> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) throw new Error('Vui lòng đăng nhập.');
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthTokens>(response);
  },
};
