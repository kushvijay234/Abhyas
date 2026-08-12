import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('abhyas_token');
        const storedUser = await AsyncStorage.getItem('abhyas_user');
        
        if (storedToken) setToken(storedToken);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to load auth state:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.auth.login(email, password);
      if (res.token) {
        setToken(res.token);
        setUser(res.user);
        await AsyncStorage.setItem('abhyas_token', res.token);
        await AsyncStorage.setItem('abhyas_user', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Error occurred during login' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await api.auth.register(username, email, password);
      if (res.success || res.message) {
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Error occurred during registration' };
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('abhyas_token');
    await AsyncStorage.removeItem('abhyas_user');
  };

  const updateProfileState = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('abhyas_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
