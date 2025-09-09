import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface LoginResponse {
  userId: string;
  token: string;
  name?: string;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const isAuthenticated = Boolean(token);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Firebase Authentication ile giriş yap
      const response = await axios.post<LoginResponse>('https://waterappdashboard2.onrender.com/api/auth/login', {
        email,
        password,
        returnSecureToken: true
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Login response:', response.data);
      const { token, userId, name } = response.data;
      if (!token) {
        throw new Error('Token not found in response');
      }
      console.log('User info:', { userId, name });
      localStorage.setItem('adminToken', token);
      localStorage.setItem('userEmail', name || ''); // name field contains email in Firebase response
      setToken(token);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Giriş başarısız. Lütfen e-posta ve şifrenizi kontrol edin.');
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