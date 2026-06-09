import { useState } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

/**
 * MFAVerification Component
 * Displayed during login for users with MFA enabled
 * Shows a 6-digit code input field
 */
export default function MFAVerification({
  email,
  onVerify,
  onBack,
  loading = false,
  error = "",
}) {
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    // Validate code format
    if (!code || code.length !== 6) {
      setLocalError("Please enter a 6-digit code");
      return;
    }

    if (!/^\d+$/.test(code)) {
      setLocalError("Code must contain only numbers");
      return;
    }

    onVerify(code);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    if (localError) setLocalError("");
  };

  const displayError = error || localError;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#0f1621",
        backgroundImage:
          "linear-gradient(135deg, #0f1621 0%, #1a2332 100%)",
      }}
    >
      <Card
        sx={{
          p: 5,
          width: 380,
          border: "1px solid #1f2937",
          bgcolor: "#1a2540",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <ShieldIcon sx={{ color: "#3b82f6", fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700}>
            Two-Factor Auth
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: "#64748b", letterSpacing: 1.5, textTransform: "uppercase" }}
        >
          Enter verification code
        </Typography>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
          {/* Email info */}
          <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
            Signing in as <strong>{email}</strong>
          </Typography>

          {/* Code input */}
          <TextField
            label="6-Digit Code"
            type="text"
            fullWidth
            inputMode="numeric"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            disabled={loading}
            sx={{
              mb: 2.5,
              "& input": {
                textAlign: "center",
                letterSpacing: "0.5em",
                fontSize: "1.25rem",
                fontWeight: 600,
                fontFamily: "monospace",
              },
            }}
            helperText="Open your authenticator app and enter the 6-digit code"
          />

          {/* Error alert */}
          {displayError && (
            <Alert severity="error" sx={{ mb: 2, mb: 2 }}>
              {displayError}
            </Alert>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || code.length !== 6}
            startIcon={
              loading ? <CircularProgress size={20} /> : <VerifiedUserIcon />
            }
            sx={{ mb: 2 }}
          >
            {loading ? "Verifying..." : "Verify Code"}
          </Button>

          {/* Back button */}
          <Button
            variant="outlined"
            fullWidth
            onClick={onBack}
            disabled={loading}
            sx={{ color: "#94a3b8" }}
          >
            Back to Login
          </Button>

          
        </Box>

        {/* Info box */}
        <Box
          sx={{
            mt: 4,
            p: 3,
            bgcolor: "#0f1621",
            border: "1px solid #1f2937",
            borderRadius: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "#94a3b8",
              fontSize: "0.85rem",
              lineHeight: 1.6,
            }}
          >
            <strong>What's this?</strong>
            <br />
            Two-factor authentication adds an extra layer of security to your
            account. Even if someone has your password, they can't sign in
            without your authenticator code.
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}