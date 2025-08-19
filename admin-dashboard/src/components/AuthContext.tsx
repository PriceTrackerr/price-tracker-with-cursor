import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('admin_token');
    console.log('AuthContext: Stored token:', stored);
    if (stored) setToken(stored);
    setLoading(false);
  }, []);

  const login = (newToken: string) => {
    console.log('AuthContext: Setting token:', newToken);
    setToken(newToken);
    localStorage.setItem('admin_token', newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  const isAuthenticated = !!token;
  console.log('AuthContext: isAuthenticated =', isAuthenticated, 'token =', token ? 'present' : 'null');
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
} 