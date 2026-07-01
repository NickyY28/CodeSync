import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
axios.defaults.baseURL = "http://localhost:5000";

// ── Run this SYNCHRONOUSLY at module load time ──────────
// This executes before any component mounts or any useEffect fires
// so the header is always set before the first request
const token = localStorage.getItem("token");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}
// ────────────────────────────────────────────────────────

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

const clearStoredAuth = () => {
  localStorage.removeItem("token");
  delete axios.defaults.headers.common["Authorization"];
};

// Drop expired tokens before any request runs
if (token && isTokenExpired(token)) {
  clearStoredAuth();
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem("token");
    if (!t || isTokenExpired(t)) {
      if (t) clearStoredAuth();
      return null;
    }
    return decodeToken(t);
  });

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setUser(decodeToken(newToken));
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          clearStoredAuth();
          setUser(null);
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); //custom hook to use the auth context,Is line se useAuth ek special shortcut function ban gaya. Matlab ab frontend ki koi bhi file me aap useAuth() likhoge to aapko seedha user, token, login(), logout(), loading sab mil jayenge. 