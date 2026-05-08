import React, { createContext, useContext, useEffect, useState } from 'react';
import { getMe, postLogin, postLogout, postRegister, TOKEN_KEY, type User, type UserRole } from '@/services/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Demo credentials for when backend is not available
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'user@demo.com': {
    password: 'demo',
    user: { id: '1', name: 'Demo Customer', email: 'user@demo.com', role: 'Customer' }
  },
  'kitchen@demo.com': {
    password: 'demo',
    user: { id: '2', name: 'Demo Kitchen Staff', email: 'kitchen@demo.com', role: 'Kitchen Staff', branchId: 'branch-1' }
  },
  'manager@demo.com': {
    password: 'demo',
    user: { id: '3', name: 'Demo Manager', email: 'manager@demo.com', role: 'Branch Manager', branchId: 'branch-1' }
  },
  'admin@demo.com': {
    password: 'demo',
    user: { id: '4', name: 'Demo Admin', email: 'admin@demo.com', role: 'Admin' }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useDemoMode, setUseDemoMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem('foodchain_user');
    const demoMode = localStorage.getItem('foodchain_demo_mode') === 'true';

    if (!stored) {
      setIsLoading(false);
      return;
    }

    setToken(stored);
    setUseDemoMode(demoMode);

    // If in demo mode, restore user from localStorage
    if (demoMode && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoading(false);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('foodchain_user');
        localStorage.removeItem('foodchain_demo_mode');
        setIsLoading(false);
      }
      return;
    }

    // Try real API
    getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('foodchain_user');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Try real API first
      const { token: newToken, user: newUser } = await postLogin(email, password);
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem('foodchain_user', JSON.stringify(newUser));
      localStorage.removeItem('foodchain_demo_mode');
      setToken(newToken);
      setUser(newUser);
      setUseDemoMode(false);
    } catch (error: any) {
      // If API fails (network error, not running, etc.), use demo mode
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        const demoAccount = DEMO_USERS[email];
        if (demoAccount && demoAccount.password === password) {
          const demoToken = `demo_token_${Date.now()}`;
          localStorage.setItem(TOKEN_KEY, demoToken);
          localStorage.setItem('foodchain_user', JSON.stringify(demoAccount.user));
          localStorage.setItem('foodchain_demo_mode', 'true');

          // Pre-populate demo data for customer
          if (demoAccount.user.role === 'Customer') {
            localStorage.setItem('foodchain_phone_number', '08012345678');
            localStorage.setItem('foodchain_delivery_location', '12 Admiralty Way, Lekki Phase 1, Lagos');
          }

          setToken(demoToken);
          setUser(demoAccount.user);
          setUseDemoMode(true);
        } else {
          throw new Error('Invalid demo credentials');
        }
      } else {
        throw error;
      }
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // Try real API first
      const { token: newToken, user: newUser } = await postRegister(name, email, password);
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem('foodchain_user', JSON.stringify(newUser));
      localStorage.removeItem('foodchain_demo_mode');
      setToken(newToken);
      setUser(newUser);
      setUseDemoMode(false);
    } catch (error: any) {
      // If API fails, create demo user
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        const newUser: User = {
          id: `demo_${Date.now()}`,
          name,
          email,
          role: 'Customer'
        };
        const demoToken = `demo_token_${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, demoToken);
        localStorage.setItem('foodchain_user', JSON.stringify(newUser));
        localStorage.setItem('foodchain_demo_mode', 'true');
        setToken(demoToken);
        setUser(newUser);
        setUseDemoMode(true);
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    if (!useDemoMode) {
      try {
        await postLogout();
      } catch {
        // clear state regardless of server response
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('foodchain_user');
    localStorage.removeItem('foodchain_demo_mode');
    setToken(null);
    setUser(null);
    setUseDemoMode(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isAuthenticated: !!user, isLoading }}
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
