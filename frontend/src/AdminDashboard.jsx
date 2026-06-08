import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Typography, Button, Chip, Card, CardContent, TextField,
  Table, TableBody, TableCell, TableHead, TableRow, Paper, Alert, MenuItem,
} from "@mui/material";
import { logout } from "./store/authSlice";
import { getTenants, createTenant, createTenantAdmin, resetBlocks } from "./api";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { token, email, role } = useSelector((state) => state.auth);

  const [tenants, setTenants] = useState([]);
  const [newTenantName, setNewTenantName] = useState("");
  const [adminForm, setAdminForm] = useState({ email: "", password: "", tenantId: "" });
  const [msg, setMsg] = useState(null);

  useEffect(() => { loadTenants(); }, []);

  async function loadTenants() {
    try {
      const data = await getTenants(token);
      setTenants(data);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  }

  async function handleAddTenant() {
    if (!newTenantName.trim()) return;
    try {
      await createTenant(token, newTenantName.trim());
      setNewTenantName("");
      setMsg({ type: "success", text: "Tenant created." });
      loadTenants();
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  }

  async function handleAddAdmin() {
    try {
      await createTenantAdmin(token, adminForm);
      setMsg({ type: "success", text: `Tenant admin ${adminForm.email} created.` });
      setAdminForm({ email: "", password: "", tenantId: "" });
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  }

  async function handleReset() {
    try {
      const r = await resetBlocks(token);
      setMsg({ type: "success", text: r.message || "Blocks cleared." });
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    }
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1100, mx: "auto" }}>
      {/* Top bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h5" fontWeight={700}>Platform Administration</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Chip label={role} size="small" />
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>{email}</Typography>
          <Button variant="outlined" color="warning" onClick={handleReset}>Reset IP Blocks</Button>
          <Button variant="contained" color="error" onClick={() => dispatch(logout())}>Sign out</Button>
        </Box>
      </Box>

      {msg && <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      {/* Tenants list */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Tenants (Funds)</Typography>
      <Paper sx={{ border: "1px solid #1f2937", mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow><TableCell>ID</TableCell><TableCell>Name</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell sx={{ fontFamily: "monospace", color: "#64748b" }}>#{t.id}</TableCell>
                <TableCell>{t.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Two forms side by side */}
      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {/* Add tenant */}
        <Card sx={{ flex: 1, minWidth: 320, border: "1px solid #1f2937" }}>
          <CardContent>
            <Typography fontWeight={700} sx={{ mb: 2 }}>Add a Tenant (Fund)</Typography>
            <TextField
              label="Fund name" fullWidth size="small" sx={{ mb: 2 }}
              value={newTenantName} onChange={(e) => setNewTenantName(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddTenant}>Create Tenant</Button>
          </CardContent>
        </Card>

        {/* Add tenant admin */}
        <Card sx={{ flex: 1, minWidth: 320, border: "1px solid #1f2937" }}>
          <CardContent>
            <Typography fontWeight={700} sx={{ mb: 2 }}>Add a Tenant Admin</Typography>
            <TextField
              label="Admin email" fullWidth size="small" sx={{ mb: 2 }}
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
            />
            <TextField
              label="Temporary password" type="password" fullWidth size="small" sx={{ mb: 2 }}
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
            />
            <TextField
              select label="Assign to tenant" fullWidth size="small" sx={{ mb: 2 }}
              value={adminForm.tenantId}
              onChange={(e) => setAdminForm({ ...adminForm, tenantId: e.target.value })}
            >
              {tenants.map((t) => (
                <MenuItem key={t.id} value={t.id}>#{t.id} — {t.name}</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={handleAddAdmin}>Create Admin</Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}