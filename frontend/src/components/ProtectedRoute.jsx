import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the correct dashboard for the user's role
    const dashboardMap = {
      student: "/student",
      admin: "/admin",
      staff: "/staff",
    };
    return <Navigate to={dashboardMap[user.role] || "/login"} replace />;
  }

  return children;
};

export default ProtectedRoute;
