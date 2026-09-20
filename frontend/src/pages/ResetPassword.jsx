import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read raw token from URL: /reset-password?token=<rawToken>
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // If no token in URL, show an immediate error
  useEffect(() => {
    if (!token) {
      setError(
        "Invalid or missing reset link. Please request a new password reset.",
      );
    }
  }, [token]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.newPassword || !form.confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        token,
        newPassword: form.newPassword,
      });
      setMessage(data.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to reset password. The link may have expired.",
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
          <h2>Set New Password</h2>
          <p className="auth-subtitle">
            Choose a strong new password for your account.
          </p>

          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success">
              <span>✅</span> {message} Redirecting to sign in…
            </div>
          )}

          {!message && token && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-password">
                  New Password
                </label>
                <input
                  id="reset-password"
                  className="form-input"
                  type="password"
                  name="newPassword"
                  placeholder="Minimum 6 characters"
                  value={form.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reset-confirm-password">
                  Confirm Password
                </label>
                <input
                  id="reset-confirm-password"
                  className="form-input"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                className="btn btn-primary btn-lg"
                type="submit"
                disabled={loading}
              >
                {loading ? "Resetting password…" : "Reset Password"}
              </button>
            </form>
          )}

          <div className="auth-divider">— or —</div>

          <p className="auth-footer">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
          {!token && (
            <p className="auth-footer">
              <Link to="/forgot-password">Request a new reset link</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
