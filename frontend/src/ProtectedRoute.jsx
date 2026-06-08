import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ allowedRole, children }) {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  // Not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → send to their own dashboard
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={dashboardPathForRole(role)} replace />;
  }

  return children;
}

// Helper: where each role's dashboard lives
export function dashboardPathForRole(role) {
  switch (role) {
    case "PLATFORM_ADMIN": return "/platform-admin";
    case "TENANT_ADMIN": return "/tenant-admin";
    case "FRAUD_ANALYST": return "/analyst";
    default: return "/analyst";
  }
}