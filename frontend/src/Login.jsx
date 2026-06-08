import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Card, TextField, Button, Typography, Alert, CircularProgress } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import { login } from "./api";
import { loginSuccess } from "./store/authSlice";
import { dashboardPathForRole } from "./ProtectedRoute";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("analyst@demo.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      dispatch(loginSuccess({ token: result.token, email: result.email, role: result.role }));
      navigate(dashboardPathForRole(result.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
          <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2.5 }} />
          <TextField label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2.5 }} />
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Sign in"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}