import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Card, TextField, Button, Typography, Alert, CircularProgress } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import { login } from "./api";
import { loginSuccess } from "./store/authSlice";
import { dashboardPathForRole } from "./ProtectedRoute";
import MFAVerification from "./MFAVerification";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("analyst@demo.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // MFA state
  const [mfaPending, setMfaPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  // If already logged in, redirect to the right dashboard
  useEffect(() => {
    if (isAuthenticated) navigate(dashboardPathForRole(role), { replace: true });
  }, [isAuthenticated, role, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      
      // Check if MFA is required
      if (result.mfaRequired) {
        // Stay on login, show MFA verification step
        setMfaPending(true);
        setPendingEmail(email);
        setMfaError("");
        setLoading(false);
        return;
      }
      
      // No MFA required, proceed with login
      dispatch(loginSuccess({ token: result.token, email: result.email, role: result.role }));
      navigate(dashboardPathForRole(result.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaVerify(mfaCode) {
    setMfaError("");
    setMfaLoading(true);
    try {
      const result = await login(pendingEmail, password, mfaCode);
      dispatch(loginSuccess({ token: result.token, email: result.email, role: result.role }));
      navigate(dashboardPathForRole(result.role), { replace: true });
    } catch (err) {
      setMfaError(err.message);
    } finally {
      setMfaLoading(false);
    }
  }

  function handleMfaBack() {
    setMfaPending(false);
    setPendingEmail("");
    setMfaError("");
    setPassword("");
  }

  // Show MFA verification screen
  if (mfaPending) {
    return (
      <MFAVerification
        email={pendingEmail}
        onVerify={handleMfaVerify}
        onBack={handleMfaBack}
        loading={mfaLoading}
        error={mfaError}
      />
    );
  }

  // Show login screen
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card sx={{ p: 5, width: 380, border: "1px solid #1f2937" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <ShieldIcon sx={{ color: "#3b82f6", fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700}>Account Shield</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" }}>
          Fraud Detection Console
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 4 }}>
          <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2.5 }} disabled={loading} />
          <TextField label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2.5 }} disabled={loading} />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Sign in"}
          </Button>
          <Typography variant="body2" sx={{ mt: 2, color: "#64748b", textAlign: "center" }}>
            New fund?{" "}
            <span style={{ color: "#3b82f6", cursor: "pointer" }} onClick={() => navigate("/request-access")}>
              Request access
            </span>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}