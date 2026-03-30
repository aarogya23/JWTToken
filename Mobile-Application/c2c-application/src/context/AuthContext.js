import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearStoredToken, getStoredToken, setStoredToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = async (token, fallbackEmail = '') => {
    const res = await api.get('/api/profile');
    const merged = {
      username: fallbackEmail || res.data?.username || 'User',
      ...res.data
    };
    setUser(merged);
    return merged;
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getStoredToken();
        if (token) {
          await syncProfile(token);
        }
      } catch {
        await clearStoredToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data?.token;
      if (!token) throw new Error('Token missing');
      await setStoredToken(token);
      await syncProfile(token, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (email, password, fullName) => {
    try {
      await api.post('/auth/signup', { email, password, fullName });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const refreshProfile = async () => {
    const token = await getStoredToken();
    if (!token) return null;
    return syncProfile(token);
  };

  const logout = async () => {
    await clearStoredToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshProfile
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
