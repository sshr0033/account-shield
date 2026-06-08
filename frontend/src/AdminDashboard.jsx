import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Drawer, Typography, Button, Chip, Card, CardContent, TextField,
  Table, TableBody, TableCell, TableHead, TableRow, Paper, Alert, MenuItem,
  IconButton, List, ListItemButton, ListItemText, InputAdornment, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { logout } from "./store/authSlice";
import {
  getTenants, createTenant, createTenantAdmin, resetBlocks,
  deleteTenant, getTenantAlerts, getTenantLoginAttempts, getTenantUsers, deleteUser
} from "./api";

const DRAWER_WIDTH = 280;

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { token, email, role } = useSelector((state) => state.auth);
const [tenantUsers, setTenantUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [addAdminFor, setAddAdminFor] = useState(null);
  const [dialogAdmin, setDialogAdmin] = useState({ email: "", password: "" });
  const [deleteTarget, setDeleteTarget] = useState(null); // tenant pending delete
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantAlerts, setTenantAlerts] = useState([]);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [tenantAttempts, setTenantAttempts] = useState([]);
  const [newTenantName, setNewTenantName] = useState("");
  const [adminForm, setAdminForm] = useState({ email: "", password: "", tenantId: "" });
  const [msg, setMsg] = useState(null);

  useEffect(() => { loadTenants(); }, []);

  async function loadTenants() {
    try { setTenants(await getTenants(token)); }
    catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  async function openTenant(t) {
    setSelectedTenant(t);
    try {
      const [a, att, usrs] = await Promise.all([
        getTenantAlerts(token, t.id),
        getTenantLoginAttempts(token, t.id),
        getTenantUsers(token, t.id),
      ]);
      setTenantAlerts(a);
      setTenantAttempts(att);
      setTenantUsers(usrs);
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  async function handleAddTenant() {
    if (!newTenantName.trim()) return;
    try {
      await createTenant(token, newTenantName.trim());
      setNewTenantName("");
      setMsg({ type: "success", text: "Tenant created." });
      loadTenants();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  async function handleAddAdmin() {
    try {
      await createTenantAdmin(token, adminForm);
      setMsg({ type: "success", text: `Tenant admin ${adminForm.email} created.` });
      setAdminForm({ email: "", password: "", tenantId: "" });
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

 function askDeleteTenant(t) {
    setDeleteTarget(t);
  }

  async function confirmDeleteTenant() {
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteTenant(token, id);
      setMsg({ type: "success", text: "Tenant deleted." });
      if (selectedTenant?.id === id) setSelectedTenant(null);
      loadTenants();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  async function handleReset() {
    try {
      const r = await resetBlocks(token);
      setMsg({ type: "success", text: r.message || "Blocks cleared." });
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search)
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Tenant drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH, flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH, boxSizing: "border-box",
            bgcolor: "#0d1320", borderRight: "1px solid #1f2937",
            display: "flex", flexDirection: "column",
          },
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Typography fontWeight={700} sx={{ mb: 2 }}>Tenants</Typography>
          <TextField
            size="small" fullWidth placeholder="Search tenants…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
          />
        </Box>
        <Divider sx={{ borderColor: "#1f2937" }} />
        <List sx={{ flexGrow: 1, overflow: "auto", py: 0 }}>
          {filtered.map((t) => (
            <ListItemButton
              key={t.id}
              selected={selectedTenant?.id === t.id}
              onClick={() => openTenant(t)}
              sx={{ "&.Mui-selected": { borderLeft: "2px solid #3b82f6", bgcolor: "#131a26" } }}
            >
              <ListItemText
                primary={t.name}
                secondary={`#${t.id}`}
                secondaryTypographyProps={{ sx: { color: "#64748b", fontSize: 11 } }}
              />
             <IconButton size="small" color="error"
                onClick={(e) => { e.stopPropagation(); askDeleteTenant(t); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          ))}
          {filtered.length === 0 && (
            <Typography sx={{ p: 2, color: "#64748b", fontSize: 13 }}>No tenants found.</Typography>
          )}
        </List>
        <Divider sx={{ borderColor: "#1f2937" }} />
        <Box sx={{ p: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => setSelectedTenant(null)}>
            + New tenant / admin
          </Button>
        </Box>
      </Drawer>

      {/* Main area */}
      <Box component="main" sx={{ flexGrow: 1, p: 4, overflow: "auto" }}>
        {/* Top bar */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            onClick={() => setSelectedTenant(null)}
            sx={{ cursor: "pointer", userSelect: "none" }}
          >
            Platform Administration
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>{email}</Typography>
            <Button variant="outlined" color="warning" onClick={handleReset}>Reset IP Blocks</Button>
            <Button variant="contained" color="error" onClick={() => dispatch(logout())}>Sign out</Button>
          </Box>
        </Box>

        {msg && <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

        {/* If a tenant is selected → its dashboard; else → the add forms */}
        {selectedTenant ? (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>{selectedTenant.name}</Typography>
              <Chip label={`Tenant #${selectedTenant.id}`} size="small" />
            </Box>

            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Attacks Detected</Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, mt: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>Users & Admins</Typography>
              <Button size="small" variant="outlined" onClick={() => setAddAdminFor(selectedTenant)}>
                + Add Admin
              </Button>
            </Box>
            <Paper sx={{ border: "1px solid #1f2937", mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenantUsers.length === 0 && <TableRow><TableCell colSpan={3} sx={{ color: "#64748b" }}>No users.</TableCell></TableRow>}
                  {tenantUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell sx={{ fontSize: 13 }}>{u.email}</TableCell>
                      <TableCell><Chip label={u.role} size="small" /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="error" onClick={() => setDeleteUserTarget(u)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            <Paper sx={{ border: "1px solid #1f2937", mb: 4 }}>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Type</TableCell><TableCell>Severity</TableCell><TableCell>Details</TableCell><TableCell>Status</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {tenantAlerts.length === 0 && <TableRow><TableCell colSpan={4} sx={{ color: "#64748b" }}>No attacks detected.</TableCell></TableRow>}
                  {tenantAlerts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.type}</TableCell>
                      <TableCell><Chip label={a.severity} color={a.severity === "HIGH" ? "error" : "warning"} size="small" /></TableCell>
                      <TableCell sx={{ color: "#94a3b8", fontSize: 13 }}>{a.details}</TableCell>
                      <TableCell><Typography variant="caption">{a.status}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Recent Login Activity</Typography>
            <Paper sx={{ border: "1px solid #1f2937" }}>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Time</TableCell><TableCell>Email</TableCell><TableCell>IP</TableCell><TableCell>Result</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {tenantAttempts.length === 0 && <TableRow><TableCell colSpan={4} sx={{ color: "#64748b" }}>No login activity.</TableCell></TableRow>}
                  {tenantAttempts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : "—"}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{a.emailAttempted}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{a.ipAddress}</TableCell>
                      <TableCell><Chip label={a.success ? "SUCCESS" : "FAILED"} color={a.success ? "success" : "error"} size="small" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        ) : (
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <Card sx={{ flex: 1, minWidth: 320, border: "1px solid #1f2937" }}>
              <CardContent>
                <Typography fontWeight={700} sx={{ mb: 2 }}>Add a Tenant (Fund)</Typography>
                <TextField label="Fund name" fullWidth size="small" sx={{ mb: 2 }}
                  value={newTenantName} onChange={(e) => setNewTenantName(e.target.value)} />
                <Button variant="contained" onClick={handleAddTenant}>Create Tenant</Button>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 320, border: "1px solid #1f2937" }}>
              <CardContent>
                <Typography fontWeight={700} sx={{ mb: 2 }}>Add a Tenant Admin</Typography>
                <TextField label="Admin email" fullWidth size="small" sx={{ mb: 2 }}
                  value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
                <TextField label="Temporary password" type="password" fullWidth size="small" sx={{ mb: 2 }}
                  value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
                <TextField select label="Assign to tenant" fullWidth size="small" sx={{ mb: 2 }}
                  value={adminForm.tenantId} onChange={(e) => setAdminForm({ ...adminForm, tenantId: e.target.value })}>
                  {tenants.map((t) => (<MenuItem key={t.id} value={t.id}>#{t.id} — {t.name}</MenuItem>))}
                </TextField>
                <Button variant="contained" onClick={handleAddAdmin}>Create Admin</Button>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
      <Dialog open={!!addAdminFor} onClose={() => setAddAdminFor(null)}>
        <DialogTitle>Add admin to {addAdminFor?.name}</DialogTitle>
        <DialogContent>
          <TextField label="Email" fullWidth size="small" sx={{ mt: 1, mb: 2 }}
            value={dialogAdmin.email} onChange={(e) => setDialogAdmin({ ...dialogAdmin, email: e.target.value })} />
          <TextField label="Temporary password" type="password" fullWidth size="small"
            value={dialogAdmin.password} onChange={(e) => setDialogAdmin({ ...dialogAdmin, password: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAdminFor(null)}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
            try {
              await createTenantAdmin(token, { email: dialogAdmin.email, password: dialogAdmin.password, tenantId: addAdminFor.id });
              setMsg({ type: "success", text: "Admin added." });
              setDialogAdmin({ email: "", password: "" });
              const t = addAdminFor;
              setAddAdminFor(null);
              openTenant(t); // refresh the users list
            } catch (e) { setMsg({ type: "error", text: e.message }); }
          }}>Add Admin</Button>
        </DialogActions>
      </Dialog>
      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete tenant?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete <strong>{deleteTarget?.name}</strong> (tenant #{deleteTarget?.id})
            and all of its users, including its admin. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteTenant}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!deleteUserTarget} onClose={() => setDeleteUserTarget(null)}>
        <DialogTitle>Remove user?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove <strong>{deleteUserTarget?.email}</strong> ({deleteUserTarget?.role}) from this tenant? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUserTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={async () => {
            const id = deleteUserTarget.id;
            const t = selectedTenant;
            setDeleteUserTarget(null);
            try {
              await deleteUser(token, id);
              setMsg({ type: "success", text: "User removed." });
              openTenant(t); // refresh users
            } catch (e) { setMsg({ type: "error", text: e.message }); }
          }}>Remove</Button>
        </DialogActions>
      </Dialog>
      
    </Box>
  );
}