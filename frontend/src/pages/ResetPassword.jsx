import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.email ||
      !form.otp ||
      !form.newPassword ||
      !form.confirmPassword
    ) {
      setError("All fields are required.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", {
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      });
      setMessage(data.message || "Password reset successful.");
      setForm({ email: "", otp: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password. Please try again.",
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
          <h2>Verify OTP</h2>
          <p className="auth-subtitle">
            Enter the OTP sent to your email and set a new password.
          </p>
          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success">
              <span>✅</span> {message}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">
                Registered Email Address
              </label>
              <input
                id="reset-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="yourname@nitj.ac.in"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-otp">
                OTP
              </label>
              <input
                id="reset-otp"
                className="form-input"
                type="text"
                name="otp"
                placeholder="Enter 6-digit OTP"
                value={form.otp}
                onChange={handleChange}
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-password">
                New Password
              </label>
              <input
                id="reset-password"
                className="form-input"
                type="password"
                name="newPassword"
                placeholder="New password"
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

          <div className="auth-divider">— or —</div>

          <p className="auth-footer">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
          <p className="auth-footer">
            Need a new OTP? <Link to="/forgot-password">Get a new code</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
