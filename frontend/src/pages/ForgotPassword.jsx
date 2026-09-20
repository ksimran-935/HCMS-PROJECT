import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No account found with this email. Please check and try again.",
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
          {sent ? (
            /* ── Success State ── */
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📧</div>
              <h2 style={{ marginBottom: "8px" }}>Check your inbox</h2>
              <p className="auth-subtitle" style={{ marginBottom: "24px" }}>
                A password reset link has been sent to{" "}
                <strong>{email}</strong>. It expires in{" "}
                <strong>30 minutes</strong>.
              </p>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  marginBottom: "20px",
                }}
              >
                Didn't receive it? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-primary)",
                    cursor: "pointer",
                    fontWeight: 600,
                    padding: 0,
                    fontSize: "inherit",
                  }}
                >
                  try again
                </button>
                .
              </p>
              <Link to="/login" className="btn btn-primary btn-lg">
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <h2>Forgot Password?</h2>
              <p className="auth-subtitle">
                Enter your registered email and we'll send you a reset link.
              </p>

              {error && (
                <div className="alert alert-error">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="forgot-email">
                    Registered Email Address
                  </label>
                  <input
                    id="forgot-email"
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="yourname@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Sending link…" : "Send Reset Link"}
                </button>
              </form>

              <div className="auth-divider">— or —</div>

              <p className="auth-footer">
                Remember your password? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
