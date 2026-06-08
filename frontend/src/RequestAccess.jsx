import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, TextField, Button, Typography, Alert } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import { submitEnquiry } from "./api";

export default function RequestAccess() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: "", contactEmail: "", message: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await submitEnquiry(form);
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card sx={{ p: 5, width: 460, border: "1px solid #1f2937" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <ShieldIcon sx={{ color: "#3b82f6", fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700}>Account Shield</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" }}>
          Request Access
        </Typography>

        {done ? (
          <Box sx={{ mt: 4 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              Thank you — your request has been received. Our team will be in touch shortly.
            </Alert>
            <Button variant="outlined" onClick={() => navigate("/login")}>Back to sign in</Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
              Protect your members from credential-stuffing and account takeover. Tell us about your fund and we'll set you up.
            </Typography>
            <TextField label="Company / Fund name" fullWidth sx={{ mb: 2.5 }}
              value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            <TextField label="Contact email" type="email" fullWidth sx={{ mb: 2.5 }}
              value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <TextField label="Message (optional)" fullWidth multiline rows={3} sx={{ mb: 2.5 }}
              value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button type="submit" variant="contained" size="large">Submit Request</Button>
              <Button variant="text" onClick={() => navigate("/login")}>Sign in</Button>
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
}