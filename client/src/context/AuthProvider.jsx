import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, getStoredToken, setStoredToken } from '../api/client';
import { AuthContext } from './authContext.js';

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getStoredToken());

  const setToken = useCallback((t) => {
    setStoredToken(t);
    setTokenState(t);
    if (!t) {
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await apiFetch('/api/profile');
      setUser(profile);
    } catch {
      setUser(null);
      setStoredToken(null);
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      setLoading(true);
      refreshProfile();
    } else {
      setLoading(false);
    }
  }, [token, refreshProfile]);

  const login = useCallback(
    async (email, password) => {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        json: { email, password },
      });
      if (!res?.token) {
        throw new Error('Invalid credentials');
      }
      setToken(res.token);
      return res;
    },
    [setToken],
  );

  const register = useCallback(async ({ fullName, email, password }) => {
    await apiFetch('/auth/signup', {
      method: 'POST',
      json: { fullName, email, password },
    });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
  }, [setToken]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: !!token && !!user,
      setToken,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [token, user, loading, setToken, login, register, logout, refreshProfile],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
