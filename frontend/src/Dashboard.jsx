import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Drawer, Typography, Button, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Paper,
  CircularProgress, Collapse,IconButton,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { logout } from "./store/authSlice";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { getAlerts, explainAlert, getLoginAttempts, resolveAlert, blockForeverAlert, releaseBlockAlert } from "./api";

const DRAWER_WIDTH = 230;

export default function Dashboard() {
  const dispatch = useDispatch();
  const { token, email, role } = useSelector((state) => state.auth);

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [explaining, setExplaining] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [showActivity, setShowActivity] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    setError("");
    try {
      const [alertData, attemptData] = await Promise.all([
        getAlerts(token),
        getLoginAttempts(token),
      ]);
      setAlerts(alertData);
      setAttempts(attemptData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(actionFn, alertId, label) {
    try {
      await actionFn(token, alertId);
      // refresh alerts so the status updates
      const data = await getAlerts(token);
      setAlerts(data);
    } catch (err) {
      setError(`${label} failed: ${err.message}`);
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
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            bgcolor: "#0d1320",
            borderRight: "1px solid #1f2937",
            display: "flex",
            flexDirection: "column",
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
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 4, overflow: "auto" }}>
        {/* Top bar */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography variant="h5" fontWeight={700}>Security Alerts</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Chip label={role} size="small" />
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>{email}</Typography>
            <Button variant="outlined" onClick={loadAlerts}>Refresh</Button>
            <Button variant="contained" color="error" onClick={() => dispatch(logout())}>
              Sign out
            </Button>
          </Box>
        </Box>

        {/* Stat cards */}
        <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
          <StatCard label="Total Alerts" value={alerts.length} />
          <StatCard label="Open" value={alerts.filter((a) => a.status === "OPEN").length} />
          <StatCard label="High Severity" value={alerts.filter((a) => a.severity === "HIGH").length} />
        </Box>

        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}

        {/* Alerts table */}
        {!loading && !error && (
          <Paper sx={{ border: "1px solid #1f2937", mb: 4 }}>
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
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          <Button size="small" variant="outlined" startIcon={<WarningAmberIcon />}
                            onClick={() => handleExplain(a.id)} disabled={explaining === a.id}>
                            {explaining === a.id ? "…" : "Explain"}
                          </Button>
                          <Button size="small" variant="outlined" color="success"
                            onClick={() => handleAction(resolveAlert, a.id, "Resolve")}>
                            Resolve
                          </Button>
                          <Button size="small" variant="outlined" color="error"
                            onClick={() => handleAction(blockForeverAlert, a.id, "Block")}>
                            Block Forever
                          </Button>
                          <Button size="small" variant="outlined" color="warning"
                            onClick={() => handleAction(releaseBlockAlert, a.id, "Release")}>
                            Release
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                        <Collapse in={!!explanations[a.id]}>
                          <Box sx={{ p: 2, bgcolor: "#0f1521", borderRadius: 1, my: 1 }}>
                            <Typography variant="body2" sx={{ color: "#93c5fd" }}>AI Explanation</Typography>
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

        {/* Recent login activity */}
        {/* Recent login activity (collapsible) */}
        {!loading && !error && (
          <Box>
          <Box
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h6" fontWeight={700}>
                  Recent Login Activity
                </Typography>
                <Chip label={attempts.length} size="small" />
              </Box>
              <IconButton
                size="small"
                sx={{ color: "#94a3b8" }}
                onClick={() => setShowActivity((v) => !v)}
              >
                {showActivity ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={showActivity}>
              <Paper sx={{ border: "1px solid #1f2937" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Email Attempted</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Result</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attempts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell sx={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>
                          {a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : "—"}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{a.emailAttempted}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>
                          {a.ipAddress}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={a.success ? "SUCCESS" : "FAILED"}
                            color={a.success ? "success" : "error"}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Collapse>
          </Box>
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