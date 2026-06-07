import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

const CATEGORIES = ['Electricity', 'Water', 'Cleanliness', 'Internet', 'Room Maintenance', 'Other'];
const MAX_DESC = 200;

const validateDescription = (desc) => {
  const trimmed = (desc || '').trim();
  if (!trimmed) return 'Description Required';
  if (trimmed.length > MAX_DESC) return 'Exceeds Limit';
  if (/^\d+$/.test(trimmed)) return 'Text Only Allowed';
  return null;
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StudentDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('submit');
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Form state
  const [form, setForm]       = useState({ category: '', description: '' });
  const [formError, setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoadingComplaints(true);
    try {
      const { data } = await api.get('/complaints/my');
      setComplaints(data.complaints);
    } catch {
      // silently fail — handled by axios interceptor on 401
    } finally {
      setLoadingComplaints(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'track') fetchComplaints();
  }, [activeTab, fetchComplaints]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.category) { setFormError('Category is required.'); return; }
    const descErr = validateDescription(form.description);
    if (descErr) { setFormError(descErr); return; }

    setSubmitting(true);
    try {
      await api.post('/complaints', {
        category: form.category,
        description: form.description.trim(),
      });
      setFormSuccess('Complaint Registered');
      setForm({ category: '', description: '' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const descLen  = form.description.length;
  const isNear   = descLen >= 160 && descLen <= MAX_DESC;
  const isOver   = descLen > MAX_DESC;

  // Stats
  const countByStatus = (status) => complaints.filter((c) => c.status === status).length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Student Dashboard</h1>
          <p>
            Welcome, <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>
            {user?.roomNo && ` · Room ${user.roomNo}`}
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            id="tab-submit"
            className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => setActiveTab('submit')}
          >
            📝 Submit Complaint
          </button>
          <button
            id="tab-track"
            className={`tab-btn ${activeTab === 'track' ? 'active' : ''}`}
            onClick={() => setActiveTab('track')}
          >
            📋 My Complaints
          </button>
        </div>

        {/* ── SUBMIT TAB ── */}
        {activeTab === 'submit' && (
          <div className="card submit-card">
            <h3 style={{ marginBottom: '0.75rem' }}>Submit a New Complaint</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
              Select the correct category and describe the issue clearly. A good complaint helps staff resolve the problem faster.
            </p>

            {formError   && <div className="alert alert-error"><span>⚠</span> {formError}</div>}
            {formSuccess && <div className="alert alert-success"><span>✓</span> {formSuccess}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="comp-category">Category</label>
                <select
                  id="comp-category"
                  className="form-select"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">— Select Category —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="comp-description">Description</label>
                <textarea
                  id="comp-description"
                  className="form-textarea"
                  name="description"
                  placeholder="Describe your issue in detail…"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                />
                <p className={`char-count ${isOver ? 'over-limit' : isNear ? 'near-limit' : ''}`}>
                  {descLen}/{MAX_DESC} characters
                </p>
              </div>

              <button
                id="submit-complaint-btn"
                className="btn btn-primary btn-lg"
                type="submit"
                disabled={submitting}
                style={{ marginTop: '0.75rem', width: '100%' }}
              >
                {submitting ? 'Submitting…' : '🚀 Submit Complaint'}
              </button>
            </form>
          </div>
        )}

        {/* ── TRACK TAB ── */}
        {activeTab === 'track' && (
          <div>
            {/* Mini stats */}
            {complaints.length > 0 && (
              <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total', value: complaints.length },
                  { label: 'Pending', value: countByStatus('Pending') },
                  { label: 'Assigned', value: countByStatus('Assigned') },
                  { label: 'In Progress', value: countByStatus('In Progress') },
                  { label: 'Resolved', value: countByStatus('Resolved') },
                ].map((s) => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-number">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {loadingComplaints ? (
              <div className="spinner-wrapper"><div className="spinner" /></div>
            ) : complaints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No complaints yet</h3>
                <p>Switch to "Submit Complaint" tab to file your first complaint.</p>
              </div>
            ) : (
              <div className="complaints-grid">
                {complaints.map((c) => (
                  <div className="complaint-card" key={c._id}>
                    <div className="complaint-card-top">
                      <div className="complaint-meta">
                        <span className="complaint-category">{c.category}</span>
                        <span style={{ color: 'var(--text-muted)' }}>·</span>
                        <span className="complaint-date">{formatDate(c.createdAt)}</span>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <p className="complaint-desc">{c.description}</p>

                    {c.staff && (
                      <p className="complaint-info">
                        Assigned to: <span>{c.staff.name}</span>
                        {c.staff.department && ` (${c.staff.department})`}
                      </p>
                    )}

                    {c.remarks && (
                      <div className="remarks-box">
                        💬 Staff Remark: {c.remarks}
                      </div>
                    )}

                    {c.resolvedAt && (
                      <p className="complaint-info" style={{ marginTop: '0.5rem' }}>
                        Resolved on: <span>{formatDate(c.resolvedAt)}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
