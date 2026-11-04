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
} from "@mui/material";
import {
  Close as CloseIcon,
  CalendarTodayRounded as CalendarIcon,
  EditCalendarRounded as FollowUpIcon,
  PersonOutlineRounded as PersonIcon,
  PhoneOutlined as PhoneIcon,
  LightbulbOutlined as TipIcon,
} from "@mui/icons-material";
import { updateLeadStatus } from "../services/leadService";

export default function FollowUpDateModal({
  open,
  onClose,
  lead,
  targetStatus,
  onSuccess,
}) {
  const [nextDate, setNextDate] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

  useEffect(() => {
    if (open && lead) {
      // Default to tomorrow or today
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 1);
      const defaultStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(defaultDate);
      setNextDate(lead.next_follow_up_date ? String(lead.next_follow_up_date).slice(0, 10) : defaultStr);
      setRemark("");
      setErrorMsg("");
      setSubmitting(false);
    }
  }, [open, lead, todayStr]);

  const handleSubmit = async () => {
    if (!lead?.id || !targetStatus) return;

    if (!nextDate) {
      setErrorMsg(`Next follow-up date is mandatory when moving to "${targetStatus}".`);
      return;
    }

    if (nextDate < todayStr) {
      setErrorMsg("Next follow-up date cannot be in the past. Select today or a future date.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const payload = {
        status: targetStatus,
        next_follow_up_date: nextDate,
        remark: remark.trim() || `Status updated to ${targetStatus} with follow-up on ${nextDate}`,
      };

      await updateLeadStatus(lead.id, payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || `Failed to update status to ${targetStatus}.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      maxWidth="xs"
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
          py: 2,
          background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              backgroundColor: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FollowUpIcon sx={{ fontSize: 20, color: "#38BDF8" }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1rem", fontFamily: "'Inter', sans-serif" }}>
              Enforce Next Follow-up
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", opacity: 0.85, fontFamily: "'Inter', sans-serif" }}>
              Moving to: <strong>{targetStatus}</strong>
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

      <DialogContent sx={{ p: 2.5, bgcolor: "#F8FAFC" }}>
        <Stack spacing={2}>
          {/* Customer mini card */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: "10px",
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
            }}
          >
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <PersonIcon sx={{ fontSize: 16, color: "#64748B" }} />
                  <Typography sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "#1E293B" }}>
                    {lead.customer_name || "N/A"}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <PhoneIcon sx={{ fontSize: 16, color: "#64748B" }} />
                  <Typography sx={{ fontSize: "0.8125rem", color: "#475569" }}>
                    {lead.mobile_number || "N/A"}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          <Alert
            severity="info"
            icon={<TipIcon sx={{ color: "#0284C7" }} />}
            sx={{
              borderRadius: "10px",
              fontSize: "0.75rem",
              bgcolor: "#E0F2FE",
              color: "#0369A1",
              border: "1px solid #BAE6FD",
            }}
          >
            Har active status transition par next follow-up date select karna mandatory hai.
          </Alert>

          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: "10px", fontSize: "0.8125rem" }}>
              {errorMsg}
            </Alert>
          )}

          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
              NEXT FOLLOW-UP DATE *
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              inputProps={{ min: todayStr }}
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              InputProps={{
                startAdornment: <CalendarIcon sx={{ fontSize: 18, color: "#0284C7", mr: 1 }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
              }}
            />
          </Box>

          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
              FOLLOW-UP NOTE / REMARKS
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="e.g. Discuss subsidy documents, review quote revised..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
              }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{ textTransform: "none", color: "#64748B", fontWeight: 600, fontSize: "0.8125rem" }}
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
            px: 2.5,
            bgcolor: "#0F172A",
            "&:hover": { bgcolor: "#1E293B" },
          }}
        >
          {submitting ? <CircularProgress size={18} color="inherit" /> : `Confirm & Set ${targetStatus}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
