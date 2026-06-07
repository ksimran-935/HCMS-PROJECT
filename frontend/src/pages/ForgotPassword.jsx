import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'OTP sent to your email address.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <img 
            src="/logo.png" 
            alt="HCMS Logo" 
            style={{ width: '100%', maxWidth: '380px', margin: '0 auto', display: 'block' }} 
          />
        </div>

        <div className="auth-card">
          <h2>Reset Password</h2>
          <p className="auth-subtitle">Enter your registered email address to receive an OTP.</p>
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
              <label className="form-label" htmlFor="forgot-email">
                Registered Email Address
              </label>
              <input
                id="forgot-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="yourname@nitj.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <small style={{ display: 'block', marginTop: '6px', fontSize: '0.78rem', opacity: 0.6 }}>
                Enter the email address registered with your account.
              </small>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
              {loading ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>

          <div className="auth-divider">— or —</div>

          <p className="auth-footer">
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
          <p className="auth-footer">
            Have OTP? <Link to="/reset-password">Reset password now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
