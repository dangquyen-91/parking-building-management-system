import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import type { UserProfile, AuthTokens } from '../services/auth.service';


interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<UserProfile>;
  register: (userData: { fullName: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let refreshPromise: Promise<AuthTokens> | null = null;

async function refreshSession(): Promise<AuthTokens> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');
  if (!refreshPromise) {
    refreshPromise = authService
      .refresh(refreshToken)
      .then((tokens) => {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        return tokens;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!accessToken || !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile(accessToken);
        setUser(profile);
      } catch (err) {
        try {
          const newTokens = await refreshSession();
          const profile = await authService.getProfile(newTokens.accessToken);
          setUser(profile);
        } catch (refreshErr) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const REFRESH_MARGIN_MS = 5 * 60 * 1000;

    const getAccessTokenExpiry = (): number | null => {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
        const payload = JSON.parse(atob(base64 + pad));
        return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
      } catch {
        return null;
      }
    };

    const refreshTokens = async () => {
      if (!localStorage.getItem('refreshToken')) return;
      try {
        await refreshSession();
      } catch {
      }
    };

    const maybeRefresh = () => {
      const expiry = getAccessTokenExpiry();
      if (expiry === null || Date.now() > expiry - REFRESH_MARGIN_MS) {
        refreshTokens();
      }
    };

    const intervalId = window.setInterval(maybeRefresh, 60 * 1000);
    const onFocus = () => {
      if (document.visibilityState === 'visible') maybeRefresh();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [user]);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const tokens = await authService.login(credentials);
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);

      const profile = await authService.getProfile(tokens.accessToken);
      setUser(profile);
      return profile;
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: { fullName: string; email: string; password: string; phone?: string }) => {
    setLoading(true);
    try {
      await authService.register(userData);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        await authService.logout(accessToken);
      } catch (err) {
        console.error('Server logout failed', err);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setLoading(false);
  };

  const updateUser = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
