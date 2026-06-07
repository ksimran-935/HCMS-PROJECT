import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

const CATEGORIES = ['Electricity', 'Water', 'Cleanliness', 'Internet', 'Room Maintenance', 'Other'];
const STATUSES   = ['Pending', 'Assigned', 'In Progress', 'Resolved'];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('complaints');

  // Complaints state
  const [complaints, setComplaints]   = useState([]);
  const [loadingC,   setLoadingC]     = useState(false);
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Students / Staff
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loadingS, setLoadingS] = useState(false);

  // Assign modal
  const [assignModal, setAssignModal] = useState(null); // complaint object
  const [selectedStaff, setSelectedStaff]   = useState('');
  const [assignLoading, setAssignLoading]   = useState(false);
  const [assignMsg, setAssignMsg]           = useState('');
  const [assignError, setAssignError]       = useState('');

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    setLoadingC(true);
    try {
      const params = {};
      if (filterStatus)   params.status   = filterStatus;
      if (filterCategory) params.category = filterCategory;
      const { data } = await api.get('/admin/complaints', { params });
      setComplaints(data.complaints);
    } catch { /* handled by interceptor */ }
    finally { setLoadingC(false); }
  }, [filterStatus, filterCategory]);

  useEffect(() => {
    if (activeTab === 'complaints') fetchComplaints();
  }, [activeTab, fetchComplaints]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    setLoadingS(true);
    try {
      const { data } = await api.get('/admin/students');
      setStudents(data.students);
    } catch { /* */ }
    finally { setLoadingS(false); }
  }, []);

  // Fetch staff
  const fetchStaff = useCallback(async () => {
    setLoadingS(true);
    try {
      const { data } = await api.get('/admin/staff');
      setStaffList(data.staff);
    } catch { /* */ }
    finally { setLoadingS(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    if (activeTab === 'staff')    fetchStaff();
  }, [activeTab, fetchStudents, fetchStaff]);

  // Ensure staff loaded for assign modal
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const openAssign = (complaint) => {
    setAssignModal(complaint);
    setSelectedStaff(complaint.staff?._id || '');
    setAssignMsg('');
    setAssignError('');
  };

  const handleAssign = async () => {
    if (!selectedStaff) { setAssignError('Please select a staff member.'); return; }
    setAssignLoading(true);
    setAssignError('');
    try {
      const { data } = await api.put(`/admin/complaints/${assignModal._id}/assign`, { staffId: selectedStaff });
      setAssignMsg(data.message);
      setComplaints((prev) =>
        prev.map((c) => (c._id === assignModal._id ? data.complaint : c))
      );
      setAssignModal(null);
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setAssignLoading(false);
    }
  };

  const countByStatus = (s) => complaints.filter((c) => c.status === s).length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Manage all hostel complaints, students, and maintenance staff.</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total',       value: complaints.length },
            { label: 'Pending',     value: countByStatus('Pending') },
            { label: 'Assigned',    value: countByStatus('Assigned') },
            { label: 'In Progress', value: countByStatus('In Progress') },
            { label: 'Resolved',    value: countByStatus('Resolved') },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-number">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button id="tab-complaints" className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')}>📋 Complaints</button>
          <button id="tab-students"   className={`tab-btn ${activeTab === 'students'   ? 'active' : ''}`} onClick={() => setActiveTab('students')}>👩‍🎓 Students</button>
          <button id="tab-staff"      className={`tab-btn ${activeTab === 'staff'      ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>🔧 Staff</button>
        </div>

        {/* ── COMPLAINTS TAB ── */}
        {activeTab === 'complaints' && (
          <div>
            <div className="section-header">
              <span className="section-title">All Complaints</span>
              <div className="filters">
                <select id="filter-status" className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select id="filter-category" className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="btn btn-outline btn-sm" onClick={fetchComplaints}>↻ Refresh</button>
              </div>
            </div>

            {loadingC ? (
              <div className="spinner-wrapper"><div className="spinner" /></div>
            ) : complaints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No complaints found</h3>
                <p>Try adjusting the filters above.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Room</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c, i) => (
                      <tr key={c._id}>
                        <td>{i + 1}</td>
                        <td><strong>{c.student?.name}</strong><br /><span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{c.student?.email}</span></td>
                        <td>{c.student?.roomNo || '—'}</td>
                        <td><span style={{color:'var(--accent-primary)',fontWeight:600}}>{c.category}</span></td>
                        <td style={{maxWidth:180}}>
                          <span title={c.description}>
                            {c.description.length > 60 ? c.description.slice(0, 60) + '…' : c.description}
                          </span>
                        </td>
                        <td><StatusBadge status={c.status} /></td>
                        <td>{c.staff ? `${c.staff.name}` : <span style={{color:'var(--text-muted)'}}>Unassigned</span>}</td>
                        <td>{formatDate(c.createdAt)}</td>
                        <td>
                          <button
                            id={`assign-btn-${c._id}`}
                            className={`btn btn-sm ${c.status === 'Resolved' ? 'btn-outline' : c.staff ? 'btn-reassign' : 'btn-primary'}`}
                            onClick={() => openAssign(c)}
                            disabled={c.status === 'Resolved'}
                            title={c.status === 'Resolved' ? 'Complaint is resolved' : c.staff ? 'Change staff assignment' : 'Assign to staff'}
                          >
                            {c.status === 'Resolved' ? '✓ Resolved' : c.staff ? '↺ Reassign' : '+ Assign'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── STUDENTS TAB ── */}
        {activeTab === 'students' && (
          <div>
            <div className="section-header">
              <span className="section-title">Registered Students ({students.length})</span>
              <button className="btn btn-outline btn-sm" onClick={fetchStudents}>↻ Refresh</button>
            </div>

            {loadingS ? (
              <div className="spinner-wrapper"><div className="spinner" /></div>
            ) : students.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">👥</div><h3>No students registered yet</h3></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Room No</th><th>Joined</th></tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s._id}>
                        <td>{i + 1}</td>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.email}</td>
                        <td>{s.phone || '—'}</td>
                        <td>{s.roomNo || '—'}</td>
                        <td>{formatDate(s.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── STAFF TAB ── */}
        {activeTab === 'staff' && (
          <div>
            <div className="section-header">
              <span className="section-title">Maintenance Staff ({staffList.length})</span>
              <button className="btn btn-outline btn-sm" onClick={fetchStaff}>↻ Refresh</button>
            </div>

            {loadingS ? (
              <div className="spinner-wrapper"><div className="spinner" /></div>
            ) : staffList.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🔧</div><h3>No maintenance staff registered yet</h3><p>Staff members can self-register from the Register page.</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Phone</th></tr>
                  </thead>
                  <tbody>
                    {staffList.map((s, i) => (
                      <tr key={s._id}>
                        <td>{i + 1}</td>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.email}</td>
                        <td><span style={{color:'var(--accent-primary)',fontWeight:600}}>{s.department || '—'}</span></td>
                        <td>{s.phone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── ASSIGN MODAL ── */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Assign Complaint</span>
              <button className="modal-close" onClick={() => setAssignModal(null)}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Category</p>
              <p style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{assignModal.category}</p>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Description</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{assignModal.description}</p>
            </div>

            {assignError && <div className="alert alert-error"><span>⚠</span> {assignError}</div>}
            {assignMsg   && <div className="alert alert-success"><span>✓</span> {assignMsg}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="modal-staff-select">Select Staff Member</label>
              <select
                id="modal-staff-select"
                className="form-select"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                <option value="">— Choose Staff —</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-outline" onClick={() => setAssignModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button
                id="confirm-assign-btn"
                className="btn btn-primary"
                onClick={handleAssign}
                disabled={assignLoading}
                style={{ flex: 1 }}
              >
                {assignLoading ? 'Assigning…' : '✓ Confirm Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
