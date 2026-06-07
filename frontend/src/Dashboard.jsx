import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Drawer, AppBar, Toolbar, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Paper,
  CircularProgress, Collapse,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { getAlerts, explainAlert } from "./api";
import { logout } from "./store/authSlice";

const DRAWER_WIDTH = 230;

export default function Dashboard() {
  const dispatch = useDispatch();
  const { token, email, role } = useSelector((state) => state.auth);

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [explaining, setExplaining] = useState(null);
  const [explanations, setExplanations] = useState({});

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    setError("");
    try {
      const data = await getAlerts(token);
      setAlerts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExplain(alertId) {
    setExplaining(alertId);
    try {
      const result = await explainAlert(token, alertId);
      setExplanations((prev) => ({ ...prev, [alertId]: result.explanation }));
    } catch {
      setExplanations((prev) => ({ ...prev, [alertId]: "Could not load explanation." }));
    } finally {
      setExplaining(null);
    }
  }

  const severityColor = (sev) =>
    sev === "HIGH" ? "error" : sev === "MEDIUM" ? "warning" : "success";

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: "#0d1320",
            borderRight: "1px solid #1f2937",
          },
        }}
      >
        <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1 }}>
          <ShieldIcon sx={{ color: "#3b82f6" }} />
          <Typography fontWeight={700}>Account Shield</Typography>
        </Box>
        <Box sx={{ px: 3, py: 1.5, bgcolor: "#131a26", borderLeft: "2px solid #3b82f6" }}>
          <Typography variant="body2">Alerts</Typography>
        </Box>
        <Box sx={{ mt: "auto", p: 3, borderTop: "1px solid #1f2937" }}>
          <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>
            {email}
          </Typography>
          <Chip label={role} size="small" sx={{ mb: 1.5 }} />
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={() => dispatch(logout())}
          >
            Sign out
          </Button>
        </Box>
      </Drawer>

      {/* Main */}
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography variant="h5" fontWeight={700}>Security Alerts</Typography>
          <Button variant="outlined" onClick={loadAlerts}>Refresh</Button>
        </Box>

        {/* Stat cards */}
        <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
          <StatCard label="Total Alerts" value={alerts.length} />
          <StatCard label="Open" value={alerts.filter((a) => a.status === "OPEN").length} />
          <StatCard label="High Severity" value={alerts.filter((a) => a.severity === "HIGH").length} />
        </Box>

        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}

        {!loading && !error && (
          <Paper sx={{ border: "1px solid #1f2937" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((a) => (
                  <>
                    <TableRow key={a.id}>
                      <TableCell sx={{ fontFamily: "monospace", color: "#64748b" }}>#{a.id}</TableCell>
                      <TableCell>{a.type}</TableCell>
                      <TableCell>
                        <Chip label={a.severity} color={severityColor(a.severity)} size="small" />
                      </TableCell>
                      <TableCell sx={{ color: "#94a3b8", fontSize: 13 }}>{a.details}</TableCell>
                      <TableCell><Typography variant="caption">{a.status}</Typography></TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<WarningAmberIcon />}
                          onClick={() => handleExplain(a.id)}
                          disabled={explaining === a.id}
                        >
                          {explaining === a.id ? "…" : "Explain"}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                        <Collapse in={!!explanations[a.id]}>
                          <Box sx={{ p: 2, bgcolor: "#0f1521", borderRadius: 1, my: 1 }}>
                            <Typography variant="body2" sx={{ color: "#93c5fd" }}>
                              AI Explanation
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#cbd5e1", mt: 0.5 }}>
                              {explanations[a.id]}
                            </Typography>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

function StatCard({ label, value }) {
  return (
    <Card sx={{ minWidth: 140, border: "1px solid #1f2937" }}>
      <CardContent>
        <Typography variant="h4" fontWeight={700}>{value}</Typography>
        <Typography variant="caption" sx={{ color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}