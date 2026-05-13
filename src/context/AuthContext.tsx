import React, { createContext, useContext, useEffect, useState } from 'react';
import { getMe, postLogin, postLogout, postRegister, updateProfile, TOKEN_KEY, REFRESH_TOKEN_KEY, type User } from '@/services/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<'logged_in' | 'verify_email'>;
  completeOAuthLogin: (accessToken: string, refreshToken?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem('foodchain_user');

    if (!stored) {
      setIsLoading(false);
      return;
    }

    setToken(stored);

    getMe()
      .then((freshUser) => {
        localStorage.setItem('foodchain_user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch((error: any) => {
        const status: number | undefined = error.response?.status;
        const isTransient =
          status == null ||
          (status >= 500 && status <= 599);

        if (isTransient && storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            return;
          } catch {
            // Fall through and clear the broken local cache.
          }
        }

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('foodchain_user');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const resp = await postLogin(email, password);
    const newToken = resp.token ?? resp.accessToken ?? '';
    const newUser = resp.user;

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem('foodchain_user', JSON.stringify(newUser));
    if (resp.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, resp.refreshToken);

    setToken(newToken);
    setUser(newUser);
    await syncPendingLocation();
  };

  const register = async (name: string, email: string, password: string): Promise<'logged_in' | 'verify_email'> => {
    await postRegister(name, email, password);
    localStorage.setItem('foodchain_pending_email', email);
    return 'verify_email';
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined;

    try {
      await postLogout(refreshToken);
    } catch {
      // Clear local auth state even if the server logout request fails.
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('foodchain_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const syncPendingLocation = async () => {
    const raw = localStorage.getItem('foodchain_pending_location');
    if (!raw) return;
    try {
      const { addressLine, latitude, longitude } = JSON.parse(raw);
      if (addressLine && latitude != null && longitude != null) {
        await updateProfile({ addressLine, latitude, longitude });
        const me = await getMe();
        localStorage.setItem('foodchain_user', JSON.stringify(me));
        setUser(me);
      }
    } catch {
      // silent — don't block login if this fails
    } finally {
      localStorage.removeItem('foodchain_pending_location');
    }
  };

  const refreshUser = async () => {
    const me = await getMe();
    localStorage.setItem('foodchain_user', JSON.stringify(me));
    setUser(me);
  };

  const completeOAuthLogin = async (accessToken: string, refreshToken?: string): Promise<User> => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    setToken(accessToken);

    const me = await getMe();
    localStorage.setItem('foodchain_user', JSON.stringify(me));
    setUser(me);
    await syncPendingLocation();
    return me;
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, completeOAuthLogin, logout, refreshUser, isAuthenticated: !!user, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
