import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = [
  "#7c3aed",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
];

const KPICard = ({ label, value, icon, color }) => (
  <div
    style={{
      background: "var(--card-bg)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
    }}
  >
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: "12px",
        background: `${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div style={{ fontSize: "2rem", fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}
      >
        {label}
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, children, height = 260 }) => (
  <div
    style={{
      background: "var(--card-bg)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "1.5rem",
    }}
  >
    <h3 style={{ marginBottom: "1.25rem", fontSize: "1rem", fontWeight: 600 }}>
      {title}
    </h3>
    <div style={{ height }}>{children}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "8px 14px",
        fontSize: "0.85rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color || p.fill }}>
          {p.name || "Count"}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await api.get("/admin/analytics");
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading)
    return (
      <div className="spinner-wrapper" style={{ minHeight: 300 }}>
        <div className="spinner" />
      </div>
    );

  if (error)
    return (
      <div className="alert alert-error" style={{ margin: "1rem 0" }}>
        <span>⚠</span> {error}
        <button
          className="btn btn-outline btn-sm"
          onClick={fetchAnalytics}
          style={{ marginLeft: "1rem" }}
        >
          Retry
        </button>
      </div>
    );

  if (!data) return null;

  const { summary, byCategory, byHostel, byMonth } = data;

  const kpis = [
    {
      label: "Total Complaints",
      value: summary.total,
      icon: "",
      color: "#7c3aed",
    },
    { label: "Pending", value: summary.pending, icon: "", color: "#f59e0b" },
    { label: "Assigned", value: summary.assigned, icon: "", color: "#06b6d4" },
    {
      label: "In Progress",
      value: summary.inProgress,
      icon: "",
      color: "#8b5cf6",
    },
    {
      label: "Resolved",
      value: summary.resolved,
      icon: "✅",
      color: "#10b981",
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <span className="section-title">Analytics Overview</span>
        <button className="btn btn-outline btn-sm" onClick={fetchAnalytics}>
          ↻ Refresh
        </button>
      </div>

      {/* KPI Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        {kpis.map((k) => (
          <KPICard key={k.label} {...k} />
        ))}
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Complaints by Category — Bar Chart */}
        <ChartCard title=" Complaints by Category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={byCategory}
              margin={{ top: 0, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Complaints" radius={[6, 6, 0, 0]}>
                {byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Complaints by Hostel — Pie Chart */}
        <ChartCard title=" Complaints by Hostel">
          {byHostel.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--text-muted)",
              }}
            >
              No hostel data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byHostel}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {byHostel.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Complaints over Time — Line Chart */}
        <ChartCard title=" Complaints Over Time (Last 6 Months)" height={260}>
          {byMonth.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "var(--text-muted)",
              }}
            >
              No timeline data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={byMonth}
                margin={{ top: 0, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Complaints"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#7c3aed" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Status Breakdown — Horizontal Bar */}
        <ChartCard title=" Status Breakdown">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={[
                { name: "Pending", value: summary.pending, fill: "#f59e0b" },
                { name: "Assigned", value: summary.assigned, fill: "#06b6d4" },
                {
                  name: "In Progress",
                  value: summary.inProgress,
                  fill: "#8b5cf6",
                },
                { name: "Resolved", value: summary.resolved, fill: "#10b981" },
              ]}
              margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0, 6, 6, 0]}>
                {[
                  { fill: "#f59e0b" },
                  { fill: "#06b6d4" },
                  { fill: "#8b5cf6" },
                  { fill: "#10b981" },
                ].map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
