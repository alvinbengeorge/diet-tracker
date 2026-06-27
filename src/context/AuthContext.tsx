'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load active session on mount
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auto login check failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      router.push('/login');
    }
  };

  // Wrapped fetch that handles JWT attaching and automatic refresh rotation
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    let currentToken = accessToken;

    // Append Authorization Header if token is present
    const headers = new Headers(options.headers || {});
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    options.headers = headers;

    let response = await fetch(url, options);

    // If 401 Unauthorized, token might have expired. Try to refresh.
    if (response.status === 401) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.accessToken;
          setAccessToken(newToken);
          setUser(refreshData.user);

          // Retry the request with the new token
          const retryHeaders = new Headers(options.headers);
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          options.headers = retryHeaders;
          response = await fetch(url, options);
        } else {
          // Refresh token expired or invalid, log out
          setAccessToken(null);
          setUser(null);
          router.push('/login');
        }
      } catch (refreshErr) {
        console.error('Automatic token refresh failed:', refreshErr);
        setAccessToken(null);
        setUser(null);
        router.push('/login');
      }
    }

    return response;
  }, [accessToken, router]);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
