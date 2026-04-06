import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

// Set base URL once — all axios calls use this automatically
axios.defaults.baseURL = "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If token exists in localStorage, attach it to every request
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Decode user from token payload (base64 middle section)
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    }
    setLoading(false);
  }, [token]);

  const login = (token) => {
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const payload = JSON.parse(atob(token.split(".")[1]));
    setUser(payload);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);