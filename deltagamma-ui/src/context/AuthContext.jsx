import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get("token");
    if (callbackToken) {
      localStorage.setItem("dgToken", callbackToken);
      window.history.replaceState({}, document.title, "/");
    }

    async function bootstrap() {
      const token = localStorage.getItem("dgToken");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/api/profile");
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem("dgToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      localStorage.setItem("dgToken", response.data.token);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const signup = async (fullName, email, password) => {
    try {
      await api.post("/auth/signup", { fullName, email, password });
      return await login(email, password);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Signup failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("dgToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
