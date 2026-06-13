import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";

const CATEGORIES = [
  "Electricity",
  "Water",
  "Cleanliness",
  "Internet",
  "Room Maintenance",
  "Other",
];
const MAX_DESC = 500;

const validateDescription = (desc) => {
  const trimmed = (desc || "").trim();
  if (!trimmed) return "Description Required";
  if (trimmed.length > MAX_DESC) return "Exceeds 500 character limit";
  if (/^\d+$/.test(trimmed)) return "Text Only Allowed";
  return null;
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const StudentDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("submit");
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Form state — pre-fill phone/room from user profile
  const [form, setForm] = useState({
    category: "",
    description: "",
    hostel: "",
    roomNo: user?.roomNo || "",
    mobileNo: user?.phone || "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoadingComplaints(true);
    try {
      const { data } = await api.get("/complaints/my");
      setComplaints(data.complaints);
    } catch {
      // silently fail — handled by axios interceptor on 401
    } finally {
      setLoadingComplaints(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "track") fetchComplaints();
  }, [activeTab, fetchComplaints]);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.category) {
      setFormError("Category is required.");
      return;
    }
    if (!form.hostel.trim()) {
      setFormError("Hostel name is required.");
      return;
    }
    if (!form.mobileNo.trim() || !/^\d{10}$/.test(form.mobileNo.trim())) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }
    const descErr = validateDescription(form.description);
    if (descErr) {
      setFormError(descErr);
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/complaints", {
        category: form.category,
        description: form.description.trim(),
        hostel: form.hostel.trim(),
        roomNo: form.roomNo.trim(),
        mobileNo: form.mobileNo.trim(),
      });
      setFormSuccess(data.message || "Complaint Registered");
      setForm({
        category: "",
        description: "",
        hostel: "",
        roomNo: user?.roomNo || "",
        mobileNo: user?.phone || "",
      });
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Failed to submit complaint.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const descLen = form.description.length;
  const isNear = descLen >= 400 && descLen <= MAX_DESC;
  const isOver = descLen > MAX_DESC;

  const countByStatus = (status) =>
    complaints.filter((c) => c.status === status).length;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Student Dashboard</h1>
          <p>
            Welcome,{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {user?.name}
            </strong>
            {user?.roomNo && ` · Room ${user.roomNo}`}
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            id="tab-submit"
            className={`tab-btn ${activeTab === "submit" ? "active" : ""}`}
            onClick={() => setActiveTab("submit")}
          >
            Submit Complaint
          </button>
          <button
            id="tab-track"
            className={`tab-btn ${activeTab === "track" ? "active" : ""}`}
            onClick={() => setActiveTab("track")}
          >
            My Complaints
          </button>
        </div>

        {/* ── SUBMIT TAB ── */}
        {activeTab === "submit" && (
          <div className="card submit-card">
            <h3 style={{ marginBottom: "0.75rem" }}>Submit a New Complaint</h3>
            <p
              style={{
                marginBottom: "1.5rem",
                color: "var(--text-muted)",
                lineHeight: 1.65,
              }}
            >
              Fill in all fields below. Your complaint will be automatically
              assigned to the relevant department.
            </p>

            {formError && (
              <div className="alert alert-error">
                <span>⚠</span> {formError}
              </div>
            )}
            {formSuccess && (
              <div className="alert alert-success">
                <span>✓</span> {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Category */}
              <div className="form-group">
                <label className="form-label" htmlFor="comp-category">
                  Category <span style={{ color: "var(--error)" }}>*</span>
                </label>
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
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Two-column row: Hostel + Room No */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="comp-hostel">
                    Hostel <span style={{ color: "var(--error)" }}>*</span>
                  </label>
                  <input
                    id="comp-hostel"
                    className="form-input"
                    type="text"
                    name="hostel"
                    placeholder="e.g. Boys Hostel 1"
                    value={form.hostel}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="comp-roomno">
                    Room Number
                  </label>
                  <input
                    id="comp-roomno"
                    className="form-input"
                    type="text"
                    name="roomNo"
                    placeholder="e.g. A-204"
                    value={form.roomNo}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="comp-mobile">
                  Mobile Number <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  id="comp-mobile"
                  className="form-input"
                  type="tel"
                  name="mobileNo"
                  placeholder="10-digit mobile number"
                  value={form.mobileNo}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="comp-description">
                  Description <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <textarea
                  id="comp-description"
                  className="form-textarea"
                  name="description"
                  placeholder="Describe your issue in detail…"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                />
                <p
                  className={`char-count ${isOver ? "over-limit" : isNear ? "near-limit" : ""}`}
                >
                  {descLen}/{MAX_DESC} characters
                </p>
              </div>

              <button
                id="submit-complaint-btn"
                className="btn btn-primary btn-lg"
                type="submit"
                disabled={submitting}
                style={{ marginTop: "0.75rem", width: "100%" }}
              >
                {submitting ? "Submitting…" : " Submit Complaint"}
              </button>
            </form>
          </div>
        )}

        {/* ── TRACK TAB ── */}
        {activeTab === "track" && (
          <div>
            {/* Mini stats */}
            {complaints.length > 0 && (
              <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
                {[
                  { label: "Total", value: complaints.length },
                  { label: "Pending", value: countByStatus("Pending") },
                  { label: "Assigned", value: countByStatus("Assigned") },
                  { label: "In Progress", value: countByStatus("In Progress") },
                  { label: "Resolved", value: countByStatus("Resolved") },
                ].map((s) => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-number">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {loadingComplaints ? (
              <div className="spinner-wrapper">
                <div className="spinner" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"></div>
                <h3>No complaints yet</h3>
                <p>
                  Switch to "Submit Complaint" tab to file your first complaint.
                </p>
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

                    {/* Location info */}
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        margin: "0.4rem 0 0.6rem",
                      }}
                    >
                      {c.hostel && <span> {c.hostel}</span>}
                      {c.roomNo && <span> Room {c.roomNo}</span>}
                      {c.mobileNo && <span> {c.mobileNo}</span>}
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
                        Staff Remark: {c.remarks}
                      </div>
                    )}

                    {c.resolvedAt && (
                      <p
                        className="complaint-info"
                        style={{ marginTop: "0.5rem" }}
                      >
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
