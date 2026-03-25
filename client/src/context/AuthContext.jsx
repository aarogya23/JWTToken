import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      let token = params.get('token');
      
      if (token) {
        localStorage.setItem('jwtToken', token);
        window.history.replaceState({}, document.title, '/');
      } else {
        token = localStorage.getItem('jwtToken');
      }

      if (token) {
        try {
          // Verify token syntax
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          // Actually fetch the full profile so we know about deliveryPerson overrides
          const res = await api.get('/api/profile');
          setUser({ 
            username: payload.sub || 'User',
            ...res.data
          });
        } catch (e) {
          console.error('Auth verification failed:', e);
          localStorage.removeItem('jwtToken');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const refreshProfile = async () => {
    try {
      const res = await api.get('/api/profile');
      setUser(prevUser => ({
        ...prevUser,
        ...res.data
      }));
    } catch (e) {
      console.error('Failed to sync profile', e);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { email: username, password });
      const { token } = response.data;
      localStorage.setItem('jwtToken', token);
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Fetch user data right after login
      try {
        const res = await api.get('/api/profile');
        setUser({ username: payload.sub || username, ...res.data });
      } catch (e) {
        setUser({ username: payload.sub || username });
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (username, password, name) => {
    try {
      await api.post('/auth/signup', { email: username, password, fullName: name });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('jwtToken');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
