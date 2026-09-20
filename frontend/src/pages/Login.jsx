import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ROLES = ["student", "admin", "staff"];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "", role: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password || !form.role) {
      setError("Email, password, and role are required.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.user, data.token);
      const dashMap = { student: "/student", admin: "/admin", staff: "/staff" };
      navigate(dashMap[data.user.role], { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <img
            src="/logo.png"
            alt="HCMS Logo"
            style={{
              width: "100%",
              maxWidth: "380px",
              margin: "0 auto",
              display: "block",
            }}
          />
        </div>

        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-role">
                Login As
              </label>
              <select
                id="login-role"
                className="form-select"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="">— Select Role —</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === "admin"
                      ? "Admin / Warden"
                      : r === "staff"
                        ? "Maintenance Staff"
                        : "Student"}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="login-submit"
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in…" : "→ Sign In"}
            </button>
          </form>

          <div className="auth-helper-links">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <div className="auth-divider">— or —</div>

          <p className="auth-footer">
            Don&apos;t have an account?{" "}
            <Link to="/register">Create an Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
