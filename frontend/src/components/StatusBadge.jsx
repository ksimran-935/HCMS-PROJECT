const statusConfig = {
  Pending: { cls: "badge-pending", dot: true, label: "Pending" },
  Assigned: { cls: "badge-assigned", dot: true, label: "Assigned" },
  "In Progress": { cls: "badge-inprogress", dot: true, label: "In Progress" },
  Resolved: { cls: "badge-resolved", dot: true, label: "Resolved" },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || {
    cls: "badge-pending",
    dot: true,
    label: status,
  };
  return (
    <span className={`badge ${config.cls}`}>
      {config.dot && <span className="badge-dot" />}
      {config.label}
    </span>
  );
};

export default StatusBadge;
