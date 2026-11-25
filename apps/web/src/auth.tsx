import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@tld/shared';
import { api, setToken } from './api.js';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { phone: string; password: string; fullName: string; role: 'shipper' | 'driver'; profile?: Record<string, string> }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('tld_token')) { setLoading(false); return; }
    api<{ user: User }>('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const auth: AuthState = {
    user,
    loading,    async login(phone, password) {
      const d = await api<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
      setToken(d.token);
      setUser(d.user);
    },
    async register(data) {
      const d = await api<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setToken(d.token);
      setUser(d.user);
    },
    logout() {
      setToken(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
