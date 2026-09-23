'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface AdminContextType {
  isAuthenticated: boolean;
  /** Sunucudaki oturum kontrolü bitene kadar true */
  isChecking: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType>({
  isAuthenticated: false,
  isChecking: true,
  login: async () => false,
  logout: async () => {},
});

export const useAdmin = () => useContext(AdminContext);

// Giriş bilgileri sunucuda (Netlify env) doğrulanır; oturum httpOnly çerezde tutulur.
export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Eski istemci tarafı "token"ı artık kullanılmıyor.
    localStorage.removeItem('adminToken');

    let cancelled = false;
    fetch('/api/admin/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data: { authenticated?: boolean }) => {
        if (!cancelled) setIsAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        if (!cancelled) setIsAuthenticated(false);
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      setIsAuthenticated(res.ok);
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AdminContext.Provider value={{ isAuthenticated, isChecking, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}
