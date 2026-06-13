import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "student", label: "Student", icon: "" },
  { value: "admin", label: "Admin / Warden", icon: "" },
  { value: "staff", label: "Maintenance Staff", icon: "" },
];

const DEPARTMENTS = [
  "Electricity",
  "Water",
  "Cleanliness",
  "Internet",
  "Room Maintenance",
  "Other",
];

const ROLE_REDIRECT = { student: "/student", admin: "/admin", staff: "/staff" };

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Step 1: form data
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "",
    roomNo: "",
    department: "",
  });
  // Step 2: OTP verification
  const [step, setStep] = useState(1); // 1 = form, 2 = OTP
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      return "Please enter a valid email address.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 6)
      return "Password must be at least 6 characters.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!/^\d{10}$/.test(form.phone.trim()))
      return "Please enter a valid 10-digit phone number.";
    if (!form.role) return "Please select your role.";
    if (form.role === "student" && !form.roomNo.trim())
      return "Room number is required for students.";
    if (form.role === "staff" && !form.department)
      return "Maintenance staff must select a department.";
    return null;
  };

  // Step 1: submit registration form → receive OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim(),
      };
      if (form.role === "student") payload.roomNo = form.roomNo.trim();
      if (form.role === "staff") payload.department = form.department;

      const { data } = await api.post("/auth/register", payload);
      setPendingEmail(form.email.trim().toLowerCase());
      setStep(2); // move to OTP verification step
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP → get JWT → login
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP sent to your email.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register/verify-otp", {
        email: pendingEmail,
        otp: otp.trim(),
      });
      login(data.user, data.token);
      navigate(ROLE_REDIRECT[data.user.role], { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid or expired OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim(),
        ...(form.role === "student" ? { roomNo: form.roomNo.trim() } : {}),
        ...(form.role === "staff" ? { department: form.department } : {}),
      });
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
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
          {/* ── STEP 1: Registration Form ── */}
          {step === 1 && (
            <>
              <h2>Create an Account</h2>
              <p className="auth-subtitle">
                Register as a student, admin, or maintenance staff
              </p>

              {/* Role selector cards */}
              <div
                className="role-cards"
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    id={`role-card-${r.value}`}
                    className={`role-card ${form.role === r.value ? "active" : ""}`}
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        role: r.value,
                        roomNo: "",
                        department: "",
                      }))
                    }
                  >
                    <span className="role-card-icon">{r.icon}</span>
                    <span className="role-card-label">{r.label}</span>
                  </button>
                ))}
              </div>

              {error && (
                <div className="alert alert-error">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-name">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    className="form-input"
                    type="text"
                    name="name"
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">
                    Email Address
                  </label>
                  <input
                    id="reg-email"
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
                  <label className="form-label" htmlFor="reg-password">
                    Password
                  </label>
                  <input
                    id="reg-password"
                    className="form-input"
                    type="password"
                    name="password"
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">
                    Phone Number{" "}
                    <span
                      style={{ color: "var(--error)", fontSize: "0.85rem" }}
                    >
                      *
                    </span>
                  </label>
                  <input
                    id="reg-phone"
                    className="form-input"
                    type="tel"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                {form.role === "student" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-roomno">
                      Room Number{" "}
                      <span
                        style={{ color: "var(--error)", fontSize: "0.85rem" }}
                      >
                        *
                      </span>
                    </label>
                    <input
                      id="reg-roomno"
                      className="form-input"
                      type="text"
                      name="roomNo"
                      placeholder="e.g. A-204"
                      value={form.roomNo}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                {form.role === "staff" && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-dept">
                      Department{" "}
                      <span
                        style={{ color: "var(--error)", fontSize: "0.85rem" }}
                      >
                        *
                      </span>
                    </label>
                    <select
                      id="reg-dept"
                      className="form-select"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      required
                    >
                      <option value="">— Select Department —</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  id="register-submit"
                  className="btn btn-primary btn-lg"
                  type="submit"
                  disabled={loading || !form.role}
                  style={{ marginTop: "0.5rem" }}
                >
                  {loading
                    ? "Sending OTP…"
                    : form.role
                      ? `→ Continue as ${ROLES.find((r) => r.value === form.role)?.label}`
                      : "→ Register"}
                </button>
              </form>

              <p className="auth-footer" style={{ marginTop: "1.25rem" }}>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === 2 && (
            <>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}></div>
                <h2 style={{ marginBottom: "0.5rem" }}>Verify Your Email</h2>
                <p className="auth-subtitle">
                  We sent a 6-digit OTP to <strong>{pendingEmail}</strong>.
                  <br />
                  Enter it below to activate your account.
                </p>
              </div>

              {error && (
                <div className="alert alert-error">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-otp">
                    Enter OTP
                  </label>
                  <input
                    id="reg-otp"
                    className="form-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                    style={{
                      textAlign: "center",
                      fontSize: "1.5rem",
                      letterSpacing: "0.5rem",
                    }}
                    required
                  />
                </div>

                <button
                  id="verify-otp-submit"
                  className="btn btn-primary btn-lg"
                  type="submit"
                  disabled={loading}
                  style={{ marginTop: "0.5rem" }}
                >
                  {loading ? "Verifying…" : "✓ Verify & Create Account"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
                <p className="auth-footer">
                  Didn't receive the OTP?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-primary)",
                      cursor: "pointer",
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Resend OTP
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                    setOtp("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    marginTop: "0.5rem",
                  }}
                >
                  ← Back to Registration
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
