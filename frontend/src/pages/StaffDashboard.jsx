import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

const StaffDashboard = () => {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  // Update modal
  const [modal, setModal] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const [updateError, setUpdateError] = useState("");

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/staff/complaints");
      setComplaints(data.complaints);
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const openModal = (complaint) => {
    setModal(complaint);
    setNewStatus(
      complaint.status === "Assigned" ? "In Progress" : complaint.status,
    );
    setRemarks(complaint.remarks || "");
    setUpdateMsg("");
    setUpdateError("");
  };

  const handleUpdate = async () => {
    if (!newStatus) {
      setUpdateError("Please select a status.");
      return;
    }
    setUpdating(true);
    setUpdateError("");
    try {
      const { data } = await api.put(`/staff/complaints/${modal._id}/status`, {
        status: newStatus,
        remarks,
      });
      setUpdateMsg(data.message);
      setComplaints((prev) =>
        prev.map((c) => (c._id === modal._id ? data.complaint : c)),
      );
      setTimeout(() => setModal(null), 1200);
    } catch (err) {
      setUpdateError(err.response?.data?.message || "Update failed.");
    } finally {
      setUpdating(false);
    }
  };

  const countByStatus = (s) => complaints.filter((c) => c.status === s).length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <div className="dashboard-header">
          <h1>Staff Dashboard</h1>
          <p>
            Welcome,{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {user?.name}
            </strong>
            {user?.department && ` · ${user.department} Department`}
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: "2rem" }}>
          {[
            { label: "Assigned", value: countByStatus("Assigned") },
            { label: "In Progress", value: countByStatus("In Progress") },
            { label: "Resolved", value: countByStatus("Resolved") },
            { label: "Total", value: complaints.length },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-number">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="section-header">
          <span className="section-title">My Assigned Complaints</span>
          <button className="btn btn-outline btn-sm" onClick={fetchComplaints}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="spinner-wrapper">
            <div className="spinner" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3>No complaints assigned yet</h3>
            <p>The admin will assign complaints to you shortly.</p>
          </div>
        ) : (
          <div className="complaints-grid">
            {complaints.map((c) => (
              <div className="complaint-card" key={c._id}>
                <div className="complaint-card-top">
                  <div className="complaint-meta">
                    <span className="complaint-category">{c.category}</span>
                    <span style={{ color: "var(--text-muted)" }}>·</span>
                    <span className="complaint-date">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <p className="complaint-desc">{c.description}</p>

                <div className="complaint-footer">
                  <div>
                    <p className="complaint-info">
                      Student: <span>{c.student?.name}</span>
                      {c.student?.roomNo && ` · Room ${c.student.roomNo}`}
                    </p>
                    {c.student?.phone && (
                      <p className="complaint-info">
                        Phone: <span>{c.student.phone}</span>
                      </p>
                    )}
                  </div>

                  <div className="complaint-actions">
                    {c.status !== "Resolved" && (
                      <button
                        id={`update-btn-${c._id}`}
                        className="btn btn-primary btn-sm"
                        onClick={() => openModal(c)}
                      >
                        ✎ Update Status
                      </button>
                    )}
                  </div>
                </div>

                {c.remarks && (
                  <div className="remarks-box" style={{ marginTop: "0.75rem" }}>
                    Remark: {c.remarks}
                  </div>
                )}

                {c.resolvedAt && (
                  <p className="complaint-info" style={{ marginTop: "0.5rem" }}>
                    Resolved on: <span>{formatDate(c.resolvedAt)}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── UPDATE STATUS MODAL ── */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Update Complaint Status</span>
              <button className="modal-close" onClick={() => setModal(null)}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <p
                style={{
                  fontSize: "0.825rem",
                  color: "var(--text-muted)",
                  marginBottom: "0.2rem",
                }}
              >
                Category
              </p>
              <p style={{ fontWeight: 600, color: "var(--accent-primary)" }}>
                {modal.category}
              </p>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <p
                style={{
                  fontSize: "0.825rem",
                  color: "var(--text-muted)",
                  marginBottom: "0.2rem",
                }}
              >
                Description
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {modal.description}
              </p>
            </div>

            {updateError && (
              <div className="alert alert-error">
                <span>⚠</span> {updateError}
              </div>
            )}
            {updateMsg && (
              <div className="alert alert-success">
                <span>✓</span> {updateMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="modal-status-select">
                New Status
              </label>
              <select
                id="modal-status-select"
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="modal-remarks">
                Remarks{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  (optional)
                </span>
              </label>
              <textarea
                id="modal-remarks"
                className="form-textarea"
                placeholder="Add any notes or remarks…"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                className="btn btn-outline"
                onClick={() => setModal(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                id="confirm-update-btn"
                className="btn btn-primary"
                onClick={handleUpdate}
                disabled={updating}
                style={{ flex: 1 }}
              >
                {updating ? "Updating…" : "✓ Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
