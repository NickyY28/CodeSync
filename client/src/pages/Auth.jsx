import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Auth() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const { data } = await axios.post(endpoint, form);
      login(data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* left — decorative panel */}
      <div className="auth-panel">
        <div className="auth-panel__logo">
          <span className="auth-panel__bracket">[</span>
          CodeSync
          <span className="auth-panel__bracket">]</span>
        </div>
        <p className="auth-panel__tagline">
          Real-time collaborative<br />code editing. No friction.
        </p>
        <div className="auth-panel__grid" aria-hidden="true">
          {Array.from({ length: 80 }).map((_, i) => (
            <span key={i} className="auth-panel__dot" />
          ))}
        </div>
      </div>

      {/* right — form */}
      <div className="auth-form-wrap">
        <div className="auth-form-box">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
            >
              login
            </button>
            <button
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
            >
              register
            </button>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === "register" && (
              <div className="field">
                <label className="field__label">username</label>
                <input
                  className="input"
                  name="username"
                  value={form.username}
                  onChange={handle}
                  placeholder="cooldev42"
                  required
                />
              </div>
            )}
            <div className="field">
              <label className="field__label">email</label>
              <input
                className="input"
                name="email"
                type="email"
                value={form.email}
                onChange={handle}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="field">
              <label className="field__label">password</label>
              <input
                className="input"
                name="password"
                type="password"
                value={form.password}
                onChange={handle}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "connecting..." : mode === "login" ? "sign in →" : "create account →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}