import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  Close as CloseIcon,
  PhoneMissedRounded as MissedCallIcon,
  CalendarTodayRounded as CalendarIcon,
  PersonOutlineRounded as PersonIcon,
  PhoneOutlined as PhoneIcon,
  WarningAmberRounded as WarningIcon,
} from "@mui/icons-material";
import { updateLeadStatus } from "../services/leadService";

const CALL_OUTCOMES = [
  "Ringing - Not Answered",
  "Switched Off",
  "Call Busy",
  "Disconnected / Cut Call",
  "Out of Network",
  "Customer Busy - Asked to Call Later",
  "Number Unreachable",
  "Other",
];

const ATTEMPT_OPTIONS = [
  { value: 1, label: "1st Attempt" },
  { value: 2, label: "2nd Attempt" },
  { value: 3, label: "3rd Attempt" },
  { value: 4, label: "4th+ Attempt" },
];

export default function NoResponseModal({ open, onClose, lead, onSuccess }) {
  const [attempts, setAttempts] = useState(1);
  const [outcome, setOutcome] = useState("Ringing - Not Answered");
  const [callNotes, setCallNotes] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

  useEffect(() => {
    if (open && lead) {
      const prevAttempts = Number(lead.call_attempts) || 0;
      const nextAttemptNum = prevAttempts >= 4 ? 4 : (prevAttempts + 1 || 1);
      setAttempts(nextAttemptNum);
      setOutcome("Ringing - Not Answered");
      setCallNotes("");
      
      // Default next retry to tomorrow or next day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(tomorrow);
      setNextDate(tomorrowStr);
      setErrorMsg("");
      setSubmitting(false);
    }
  }, [open, lead, todayStr]);

  const handleSubmit = async () => {
    if (!lead?.id) return;

    if (!attempts || attempts <= 0) {
      setErrorMsg("Please select the call attempt count.");
      return;
    }

    if (!outcome) {
      setErrorMsg("Please select the call outcome.");
      return;
    }

    if (!callNotes.trim()) {
      setErrorMsg("Call notes and outcome details are mandatory.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const attemptLabel = ATTEMPT_OPTIONS.find((a) => a.value === attempts)?.label || `${attempts} Attempt`;
      const fullRemark = `[No Response - ${attemptLabel}] Outcome: ${outcome} | Notes: ${callNotes.trim()}`;

      const payload = {
        status: "No Response",
        call_attempts: attempts,
        call_outcome: outcome,
        remark: fullRemark,
        next_follow_up_date: nextDate || undefined,
        customer_details: {
          call_attempts: attempts,
          call_outcome: outcome,
          call_notes: callNotes.trim(),
          logged_at: new Date().toISOString(),
        },
      };

      await updateLeadStatus(lead.id, payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to log No Response attempt.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          overflow: "hidden",
          border: "1px solid #E2E8F0",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          background: "linear-gradient(135deg, #EA580C 0%, #F97316 100%)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MissedCallIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", fontFamily: "'Inter', sans-serif" }}>
              Log No Response Attempt
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", opacity: 0.9, fontFamily: "'Inter', sans-serif" }}>
              Record Call Attempt Count & Outcome Details
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={onClose}
          disabled={submitting}
          sx={{
            color: "rgba(255,255,255,0.8)",
            "&:hover": { color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.15)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: "#F8FAFC" }}>
        <Stack spacing={2.5}>
          {/* Strict Rule Notice */}
          <Alert
            severity="warning"
            icon={<WarningIcon sx={{ color: "#EA580C" }} />}
            sx={{
              borderRadius: "12px",
              bgcolor: "#FFF7ED",
              color: "#9A3412",
              border: "1px solid #FFEDD5",
              fontSize: "0.8125rem",
              "& .MuiAlert-icon": { color: "#EA580C" },
            }}
          >
            <strong>No Response Rule:</strong> Lead ko direct band nahi kiya ja sakta. Har call attempt count aur outcome log karna compulsory hai taaki follow-up cycle active rahe.
          </Alert>

          {/* Customer Overview */}
          <Box
            sx={{
              p: 2,
              borderRadius: "12px",
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PersonIcon sx={{ fontSize: 18, color: "#64748B" }} />
                  <Typography sx={{ fontWeight: 600, fontSize: "0.875rem", color: "#1E293B" }}>
                    {lead.customer_name || "N/A"}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PhoneIcon sx={{ fontSize: 18, color: "#64748B" }} />
                  <Typography sx={{ fontSize: "0.875rem", color: "#475569" }}>
                    {lead.mobile_number || "N/A"}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: "0.8125rem", color: "#64748B" }}>
                  Previous Attempts: <strong>{lead.call_attempts || 0} recorded</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: "0.8125rem", color: "#64748B" }}>
                  Current Status: <strong>{lead.status}</strong>
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: "10px", fontSize: "0.8125rem" }}>
              {errorMsg}
            </Alert>
          )}

          {/* Attempt Selector */}
          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 1 }}>
              CALL ATTEMPT NUMBER *
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {ATTEMPT_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  clickable
                  onClick={() => setAttempts(opt.value)}
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: attempts === opt.value ? 700 : 500,
                    px: 1,
                    py: 2,
                    borderRadius: "10px",
                    bgcolor: attempts === opt.value ? "#EA580C" : "#FFFFFF",
                    color: attempts === opt.value ? "#FFFFFF" : "#475569",
                    border: `1.5px solid ${attempts === opt.value ? "#EA580C" : "#E2E8F0"}`,
                    "&:hover": {
                      bgcolor: attempts === opt.value ? "#C2410C" : "#F8FAFC",
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Outcome Dropdown */}
          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
              CALL OUTCOME *
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
              }}
            >
              {CALL_OUTCOMES.map((oc) => (
                <MenuItem key={oc} value={oc} sx={{ fontSize: "0.85rem" }}>
                  {oc}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Next Retry Date */}
          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
              SCHEDULE NEXT CALL ATTEMPT (FOLLOW-UP DATE)
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              inputProps={{ min: todayStr }}
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              InputProps={{
                startAdornment: <CalendarIcon sx={{ fontSize: 18, color: "#EA580C", mr: 1 }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
              }}
            />
          </Box>

          {/* Call Notes */}
          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
              CALL NOTES & ACTION TAKEN *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="e.g. Called customer twice at 11:30 AM, phone rang with no answer. Dropped a follow-up WhatsApp message with brochure."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
              }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ textTransform: "none", color: "#64748B", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "10px",
            px: 3,
            bgcolor: "#EA580C",
            "&:hover": { bgcolor: "#C2410C" },
          }}
        >
          {submitting ? <CircularProgress size={20} color="inherit" /> : "Log Call Attempt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
