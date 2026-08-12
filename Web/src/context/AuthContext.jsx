import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore credentials from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('abhyas_token');
    const savedUser = localStorage.getItem('abhyas_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.auth.login(email, password);
    if (response.token) {
      localStorage.setItem('abhyas_token', response.token);
      localStorage.setItem('abhyas_user', JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
      return response.user;
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('abhyas_token');
    localStorage.removeItem('abhyas_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('abhyas_user', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
