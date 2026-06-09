import { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Tab,
  Tabs,
} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { enrollMfa, confirmMfaSetup } from "./api";

/**
 * MFASetup Component
 * Dialog/Modal for FRAUD_ANALYST users to set up MFA
 * Shows QR code and manual code entry options
 */
export default function MFASetup({ token, email, open, onClose, onSuccess }) {
  const [step, setStep] = useState(0); // 0: display QR, 1: verify code
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0: QR code, 1: manual
  const [copied, setCopied] = useState(false);

  // Load QR code when dialog opens
  useEffect(() => {
    if (open && step === 0 && !qrCode) {
      loadQrCode();
    }
  }, [open]);

  async function loadQrCode() {
    setLoading(true);
    setError("");
    try {
      const result = await enrollMfa(token);
      setQrCode(result.qrCode);
      // Extract secret from response if available
      // The secret is typically returned by the backend in the response
      setSecret(result.secret || "");
    } catch (err) {
      setError(`Failed to generate QR code: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError("");

    // Validate code format
    if (!code || code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    if (!/^\d+$/.test(code)) {
      setError("Code must contain only numbers");
      return;
    }

    setLoading(true);
    try {
      await confirmMfaSetup(token, code);
      setSuccess(true);
      // Auto-close after showing success message
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(
        err.message === "invalid MFA code"
          ? "The code you entered is incorrect. Please try again."
          : `Verification failed: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(e) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    if (error) setError("");
  }

  function copyToClipboard() {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    setStep(0);
    setQrCode("");
    setSecret("");
    setCode("");
    setError("");
    setSuccess(false);
    setTabValue(0);
    setCopied(false);
    onClose();
  }

  // Step labels
  const steps = ["Generate QR Code", "Verify Code"];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#1a2540",
          border: "1px solid #1f2937",
        },
      }}
    >
      <DialogTitle sx={{ color: "#fff", fontWeight: 700, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ShieldIcon sx={{ color: "#3b82f6" }} />
          Enable Two-Factor Authentication
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Stepper */}
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Display QR Code */}
        {step === 0 && (
          <Box>
            <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
              To secure your account, you'll set up two-factor authentication
              using an authenticator app like Google Authenticator, Authy, or
              Microsoft Authenticator.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 6,
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {/* Tabs for QR code and manual entry */}
                <Box sx={{ borderBottom: 1, borderColor: "#1f2937", mb: 3 }}>
                  <Tabs
                    value={tabValue}
                    onChange={(e, newValue) => setTabValue(newValue)}
                    sx={{
                      "& .MuiTabs-indicator": { bgcolor: "#3b82f6" },
                      "& .MuiTab-root": { color: "#64748b" },
                      "& .Mui-selected": { color: "#3b82f6" },
                    }}
                  >
                    <Tab label="Scan QR Code" />
                    <Tab label="Enter Code Manually" />
                  </Tabs>
                </Box>

                {/* QR Code Tab */}
                {tabValue === 0 && qrCode && (
                  <Box sx={{ textAlign: "center", mb: 3 }}>
                    <img
                      src={qrCode}
                      alt="MFA QR Code"
                      style={{
                        maxWidth: "280px",
                        width: "100%",
                        border: "1px solid #1f2937",
                        borderRadius: "8px",
                        padding: "12px",
                        bgcolor: "#fff",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        color: "#64748b",
                        mt: 2,
                      }}
                    >
                      Scan this QR code with your authenticator app
                    </Typography>
                  </Box>
                )}

                {/* Manual Entry Tab */}
                {tabValue === 1 && secret && (
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: "#0f1621",
                      border: "1px solid #1f2937",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        color: "#94a3b8",
                        mb: 1,
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        letterSpacing: 1,
                      }}
                    >
                      Backup Code
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <TextField
                        value={secret}
                        fullWidth
                        disabled
                        size="small"
                        sx={{
                          "& .MuiInputBase-input": {
                            fontFamily: "monospace",
                            color: "#3b82f6",
                            fontSize: "0.9rem",
                          },
                        }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={copyToClipboard}
                        startIcon={<ContentCopyIcon fontSize="small" />}
                        sx={{
                          minWidth: 80,
                          color: "#3b82f6",
                          borderColor: "#3b82f6",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        color: "#64748b",
                        mt: 2,
                      }}
                    >
                      If you can't scan the QR code, enter this code manually
                      in your authenticator app.
                    </Typography>
                  </Paper>
                )}

                {/* Helper text */}
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Tip:</strong> Save a backup code in a secure
                    location. You'll need it if you lose access to your
                    authenticator app.
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Action buttons for step 1 */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button variant="outlined" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => setStep(1)}
                disabled={loading || !qrCode}
              >
                Next: Verify Code
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Verify Code */}
        {step === 1 && (
          <Box>
            {success ? (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <CheckCircleIcon
                  sx={{
                    fontSize: 60,
                    color: "#10b981",
                    mb: 2,
                  }}
                />
                <Typography variant="h6" sx={{ color: "#fff", mb: 1 }}>
                  MFA Enabled!
                </Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                  Your account is now protected with two-factor authentication.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ color: "#94a3b8", mb: 3 }}>
                  Open your authenticator app and enter the 6-digit code to
                  confirm setup.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleVerifyCode}>
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
                      mb: 3,
                      "& input": {
                        textAlign: "center",
                        letterSpacing: "0.5em",
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        fontFamily: "monospace",
                      },
                    }}
                    autoFocus
                  />

                  {/* Action buttons for step 2 */}
                  <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                    <Button
                      variant="outlined"
                      onClick={() => setStep(0)}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || code.length !== 6}
                    >
                      {loading ? "Verifying..." : "Confirm & Enable MFA"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}