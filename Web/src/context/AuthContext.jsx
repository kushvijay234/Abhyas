import { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

function getStoredUser() {
  if (typeof window === 'undefined') return null;

  try {
    const savedToken = localStorage.getItem('abhyas_token');
    const savedUser = localStorage.getItem('abhyas_user');

    if (savedToken && savedUser) {
      return JSON.parse(savedUser);
    }
  } catch (error) {
    console.error('Unable to restore saved session:', error);
  }

  return null;
}

function getStoredToken() {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem('abhyas_token');
  } catch (error) {
    console.error('Unable to read saved token:', error);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(false);

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
      {children}
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
