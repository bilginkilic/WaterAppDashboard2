import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface LoginResponse {
  token: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const isAuthenticated = Boolean(token);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? process.env.REACT_APP_PRODUCTION_API_URL 
        : process.env.REACT_APP_API_URL;
        
      const response = await axios.post<LoginResponse>(`${apiUrl}/api/admin/login`, {
        username,
        password,
      });

      const { token } = response.data;
      localStorage.setItem('adminToken', token);
      setToken(token);
    } catch (error) {
      throw new Error('Login failed');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 