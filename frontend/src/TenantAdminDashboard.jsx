import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box, Drawer, Typography, Button, Chip, TextField, Paper, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, List, ListItemButton,
  ListItemText, InputAdornment, Divider, IconButton, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, MenuItem, Card, CardContent,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import SecurityIcon from "@mui/icons-material/Security";
import { logout } from "./store/authSlice";
import {
  getMyMembers, addMember, updateMember, deleteMember,
  getMemberLoginAttempts, resetMemberBlock, getMe,
} from "./api";
import MFASetup from "./MFASetup";

const DRAWER_WIDTH = 300;

export default function TenantAdminDashboard() {
  const dispatch = useDispatch();
  const { token, email } = useSelector((state) => state.auth);

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [msg, setMsg] = useState(null);
  const [addForm, setAddForm] = useState({ email: "", password: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ email: "", role: "" });

  // MFA state
  const [showMfaBanner, setShowMfaBanner] = useState(false);
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaSetupSuccess, setMfaSetupSuccess] = useState(false);

  useEffect(() => {
    loadMembers();
    checkMfaStatus();
  }, []);

  async function checkMfaStatus() {
    try {
      const me = await getMe(token);
      if (!me.mfaEnabled) {
        const dismissed = localStorage.getItem(`mfa-setup-${email}`);
        if (!dismissed) setShowMfaBanner(true);
      }
    } catch (e) {
      // silently ignore
    }
  }

  async function loadMembers() {
    try { setMembers(await getMyMembers(token)); }
    catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  async function openMember(m) {
    setSelected(m);
    setMemberData(null);
    try { setMemberData(await getMemberLoginAttempts(token, m.id)); }
    catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  async function handleAdd() {
    try {
      await addMember(token, addForm);
      setMsg({ type: "success", text: "Member added." });
      setAddForm({ email: "", password: "" });
      loadMembers();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  async function handleDelete() {
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteMember(token, id);
      setMsg({ type: "success", text: "Member deleted." });
      if (selected?.id === id) { setSelected(null); setMemberData(null); }
      loadMembers();
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  async function handleEditSave() {
    const id = editTarget.id;
    setEditTarget(null);
    try {
      await updateMember(token, id, { email: editForm.email, role: editForm.role });
      setMsg({ type: "success", text: "Member updated." });
      loadMembers();
      if (selected?.id === id) openMember({ ...selected, email: editForm.email, role: editForm.role });
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  async function handleReset() {
    try {
      await resetMemberBlock(token, selected.id);
      setMsg({ type: "success", text: `Block reset for ${selected.email}.` });
      openMember(selected);
    } catch (e) { setMsg({ type: "error", text: e.message }); }
  }

  function handleMfaSuccess() {
    setMfaSetupSuccess(true);
    setMfaModalOpen(false);
    setShowMfaBanner(false);
    localStorage.setItem(`mfa-setup-${email}`, "true");
  }

  function handleMfaDismiss() {
  localStorage.setItem(`mfa-setup-${email}`, "dismissed");
  setShowMfaBanner(false);
}
function handleMfaModalClose() {
  setMfaModalOpen(false);
  setShowMfaBanner(true); // bring banner back
}
  const filtered = members.filter((m) =>
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>

      {/* MFA Modal */}
      <MFASetup
        token={token}
        email={email}
        open={mfaModalOpen}
         onClose={handleMfaModalClose}
        onSuccess={handleMfaSuccess}
      />

      {/* Sidebar */}
      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH, boxSizing: "border-box",
          bgcolor: "#0d1320", borderRight: "1px solid #1f2937",
          display: "flex", flexDirection: "column",
        },
      }}>
        <Box sx={{ p: 2.5 }}>
          <Typography fontWeight={700} sx={{ mb: 0.5 }}>Members</Typography>
          <Typography variant="caption" sx={{ color: "#64748b", mb: 2, display: "block" }}>
            {members.length} total
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Divider sx={{ borderColor: "#1f2937" }} />
        <List sx={{ flexGrow: 1, overflow: "auto", py: 0 }}>
          {filtered.map((m) => (
            <ListItemButton
              key={m.id}
              selected={selected?.id === m.id}
              onClick={() => openMember(m)}
              sx={{ "&.Mui-selected": { borderLeft: "2px solid #3b82f6", bgcolor: "#131a26" } }}
            >
              <ListItemText
                primary={m.email}
                secondary={m.role}
                slotProps={{ secondary: { sx: { color: "#64748b", fontSize: 11 } } }}
              />
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          ))}
          {filtered.length === 0 && (
            <Typography sx={{ p: 2, color: "#64748b", fontSize: 13 }}>No members found.</Typography>
          )}
        </List>
        <Divider sx={{ borderColor: "#1f2937" }} />
        <Box sx={{ p: 2 }}>
          <Button fullWidth variant="contained" onClick={() => setSelected(null)}>+ Add Member</Button>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 4, overflow: "auto" }}>

        {/* Top bar */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography
            variant="h5"
            fontWeight={700}
            onClick={() => { setSelected(null); setMemberData(null); }}
            sx={{ cursor: "pointer", userSelect: "none" }}
          >
            Member Management
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>{email}</Typography>
            <Button variant="contained" color="error" onClick={() => dispatch(logout())}>Sign out</Button>
          </Box>
        </Box>

        {/* MFA banner */}
        {showMfaBanner && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            onClose={handleMfaDismiss}
            action={
              <Button color="inherit" size="small" onClick={() => { setShowMfaBanner(false); setMfaModalOpen(true); }}>
                Set up now
              </Button>
            }
          >
            Secure your account with two-factor authentication.
          </Alert>
        )}

        {/* MFA success */}
        {mfaSetupSuccess && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMfaSetupSuccess(false)}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SecurityIcon fontSize="small" />
              <span>Two-factor authentication is now enabled on your account.</span>
            </Box>
          </Alert>
        )}

        {/* General messages */}
        {msg && <Alert severity={msg.type} sx={{ mb: 3 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

        {!selected ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <Typography sx={{ color: "#64748b", mb: 3, textAlign: "center" }}>
              Select a member from the list to view their details, or add a new member below.
            </Typography>
            <Card sx={{ border: "1px solid #1f2937", width: 420 }}>
              <CardContent>
                <Typography fontWeight={700} sx={{ mb: 2 }}>Add a Member</Typography>
                <TextField label="Email" fullWidth size="small" sx={{ mb: 2 }}
                  value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
                <TextField label="Temporary password" type="password" fullWidth size="small" sx={{ mb: 2 }}
                  value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
                <Button variant="contained" onClick={handleAdd}>Add Member</Button>
              </CardContent>
            </Card>
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
              <Typography variant="h6" fontWeight={700}>{selected.email}</Typography>
              <Chip label={selected.role} size="small" />
              <Button size="small" onClick={() => {
                setEditTarget(selected);
                setEditForm({ email: selected.email, role: selected.role });
              }}>
                Edit
              </Button>
            </Box>

            {memberData && (
              <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                <Chip
                  label={`Recent failures: ${memberData.recentFailureCount}`}
                  color={memberData.recentFailureCount >= 5 ? "error" : "default"}
                  size="small"
                />
                <Button size="small" variant="outlined" color="warning" onClick={handleReset}>
                  Reset Block
                </Button>
              </Box>
            )}

            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Login Activity</Typography>
            <Paper sx={{ border: "1px solid #1f2937" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Result</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!memberData && (
                    <TableRow><TableCell colSpan={3} sx={{ color: "#64748b" }}>Loading…</TableCell></TableRow>
                  )}
                  {memberData?.attempts?.length === 0 && (
                    <TableRow><TableCell colSpan={3} sx={{ color: "#64748b" }}>No activity.</TableCell></TableRow>
                  )}
                  {memberData?.attempts?.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>
                        {new Date(a.createdAt).toLocaleString()}
                      </TableCell>
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
          </>
        )}
      </Box>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)}>
        <DialogTitle>Edit member</DialogTitle>
        <DialogContent>
          <TextField label="Email" fullWidth size="small" sx={{ mt: 1, mb: 2 }}
            value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <TextField select label="Role" fullWidth size="small"
            value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
            <MenuItem value="MEMBER">MEMBER</MenuItem>
            <MenuItem value="FRAUD_ANALYST">FRAUD_ANALYST</MenuItem>
            <MenuItem value="TENANT_ADMIN">TENANT_ADMIN</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Remove member?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove <strong>{deleteTarget?.email}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}