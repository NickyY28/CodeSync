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

export const AuthProvider = ({ children }) => {
  // Initialize user synchronously too — no loading flicker
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem("token");
    return t ? decodeToken(t) : null;
  });

  const login = (token) => {
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(decodeToken(token));
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); //custom hook to use the auth context,Is line se useAuth ek special shortcut function ban gaya. Matlab ab frontend ki koi bhi file me aap useAuth() likhoge to aapko seedha user, token, login(), logout(), loading sab mil jayenge. 