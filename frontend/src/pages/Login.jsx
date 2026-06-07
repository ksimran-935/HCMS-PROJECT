import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLES = ['student', 'admin', 'staff'];

const Login = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();

  // Step 1: credentials
  const [form, setForm]       = useState({ email: '', password: '', role: '' });
  // Step 2: OTP
  const [step, setStep]       = useState(1);   // 1 = credentials, 2 = OTP
  const [otp, setOtp]         = useState('');
  const [sentEmail, setSentEmail] = useState('');

  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  /* ---------- Step 1: submit credentials ---------- */
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!form.email || !form.password || !form.role) {
      setError('Email, password, and role are required.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      // Backend sends OTP and returns otpRequired: true
      setSentEmail(data.email || form.email.trim().toLowerCase());
      setInfo(data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Step 2: verify OTP ---------- */
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp) {
      setError('Please enter the OTP sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/verify-otp', {
        email: sentEmail,
        otp,
      });
      login(data.user, data.token);
      const dashMap = { student: '/student', admin: '/admin', staff: '/staff' };
      navigate(dashMap[data.user.role], { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Resend OTP ---------- */
  const handleResend = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setInfo(data.message || 'New OTP sent to your email.');
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <img 
            src="/logo.png" 
            alt="HCMS Logo" 
            style={{ width: '100%', maxWidth: '380px', margin: '0 auto', display: 'block' }} 
          />
        </div>

        <div className="auth-card">

          {/* ── Step 1: Credentials ── */}
          {step === 1 && (
            <>
              <h2>Welcome back</h2>
              <p className="auth-subtitle">Sign in to your account to continue</p>

              {error && (
                <div className="alert alert-error">
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleCredentialsSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">Email Address</label>
                  <input
                    id="login-email"
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="you@nitj.ac.in"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="login-password">Password</label>
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
                  <label className="form-label" htmlFor="login-role">Login As</label>
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
                        {r === 'admin' ? 'Admin / Warden' : r === 'staff' ? 'Maintenance Staff' : 'Student'}
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
                  {loading ? 'Sending OTP…' : '→  Continue'}
                </button>
              </form>

              <div className="auth-helper-links">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <div className="auth-divider">— or —</div>

              <p className="auth-footer">
                Don&apos;t have an account?{' '}
                <Link to="/register">Create an Account</Link>
              </p>
            </>
          )}

          {/* ── Step 2: OTP Verification ── */}
          {step === 2 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✉️</div>
                <h2 style={{ marginBottom: '8px' }}>Check your email</h2>
                <p className="auth-subtitle">
                  We sent a 6-digit OTP to<br />
                  <strong>{sentEmail}</strong>
                </p>
              </div>

              {error && (
                <div className="alert alert-error">
                  <span>⚠</span> {error}
                </div>
              )}

              {info && (
                <div className="alert alert-success">
                  <span>✅</span> {info}
                </div>
              )}

              <form onSubmit={handleOTPSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="login-otp">Enter OTP</label>
                  <input
                    id="login-otp"
                    className="form-input"
                    type="text"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    inputMode="numeric"
                    autoFocus
                    required
                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.4rem' }}
                  />
                </div>

                <button
                  id="login-otp-submit"
                  className="btn btn-primary btn-lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Verifying…' : '✓  Verify & Sign In'}
                </button>
              </form>

              <div className="auth-divider">— or —</div>

              <p className="auth-footer">
                Didn't receive it?{' '}
                <button
                  onClick={handleResend}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    fontSize: 'inherit',
                  }}
                >
                  Resend OTP
                </button>
              </p>
              <p className="auth-footer">
                <button
                  onClick={() => { setStep(1); setError(''); setInfo(''); setOtp(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: 0,
                    fontSize: 'inherit',
                  }}
                >
                  ← Change email / role
                </button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
