import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin / Warden' },
  { value: 'staff', label: 'Maintenance Staff' },
];

const DEPARTMENTS = [
  'Electricity',
  'Water',
  'Cleanliness',
  'Internet',
  'Room Maintenance',
  'Other',
];

const ROLE_ICONS = { student: '', admin: '', staff: '' };
const ROLE_REDIRECT = { student: '/student', admin: '/admin', staff: '/staff' };

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: '', roomNo: '', department: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email address.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (!form.phone.trim()) return 'Phone number is required.';
    if (!/^\d{10}$/.test(form.phone.trim())) return 'Please enter a valid 10-digit phone number.';
    if (!form.role) return 'Please select your role.';
    if (form.role === 'student' && !form.roomNo.trim())
      return 'Room number is required for students.';
    if (form.role === 'staff' && !form.department)
      return 'Maintenance staff must select a department.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim(),
      };
      if (form.role === 'student') payload.roomNo = form.roomNo.trim();
      if (form.role === 'staff') payload.department = form.department;

      const { data } = await api.post('/auth/register', payload);
      login(data.user, data.token);
      navigate(ROLE_REDIRECT[data.user.role], { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Registration failed. Please try again.'
      );
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
          <h2>Create an Account</h2>
          <p className="auth-subtitle">Register as a student, admin, or maintenance staff</p>

          {/* Role selector cards */}
          <div className="role-cards" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                id={`role-card-${r.value}`}
                className={`role-card ${form.role === r.value ? 'active' : ''}`}
                onClick={() => setForm((p) => ({ ...p, role: r.value, roomNo: '', department: '' }))}
              >
                <span className="role-card-icon">{ROLE_ICONS[r.value]}</span>
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
            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
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

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
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

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
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

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                Phone Number <span style={{ color: 'var(--error)', fontSize: '0.85rem' }}>*</span>
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

            {/* Room No — Student only */}
            {form.role === 'student' && (
              <div className="form-group">
                <label className="form-label" htmlFor="reg-roomno">
                  Room Number <span style={{ color: 'var(--error)', fontSize: '0.85rem' }}>*</span>
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

            {/* Department — Staff only */}
            {form.role === 'staff' && (
              <div className="form-group">
                <label className="form-label" htmlFor="reg-dept">Department <span style={{ color: 'var(--error)', fontSize: '0.85rem' }}>*</span></label>
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
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              id="register-submit"
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading || !form.role}
              style={{ marginTop: '0.5rem' }}
            >
              {loading
                ? 'Creating account…'
                : form.role
                  ? `→  Register as ${ROLES.find((r) => r.value === form.role)?.label}`
                  : '→  Register'}
            </button>
          </form>

          <p className="auth-footer" style={{ marginTop: '1.25rem' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
