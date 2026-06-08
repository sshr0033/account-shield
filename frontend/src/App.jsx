import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "./Login";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import TenantAdminDashboard from "./TenantAdminDashboard";
import ProtectedRoute, { dashboardPathForRole } from "./ProtectedRoute";

export default function App() {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/analyst" element={
        <ProtectedRoute allowedRole="FRAUD_ANALYST"><Dashboard /></ProtectedRoute>
      } />
      <Route path="/tenant-admin" element={
        <ProtectedRoute allowedRole="TENANT_ADMIN"><TenantAdminDashboard /></ProtectedRoute>
      } />
      <Route path="/platform-admin" element={
        <ProtectedRoute allowedRole="PLATFORM_ADMIN"><AdminDashboard /></ProtectedRoute>
      } />

      {/* Root: send to the right place */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to={dashboardPathForRole(role)} replace /> : <Navigate to="/login" replace />
      } />

      {/* Anything else → root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}