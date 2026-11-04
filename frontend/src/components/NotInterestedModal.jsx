import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  Typography,
  Box,
  Stack,
  Chip,
  Alert,
  LinearProgress,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  CancelOutlined as CancelIcon,
  WarningAmberRounded as WarningIcon,
  CheckCircleRounded as CheckIcon,
  FormatListBulleted as ListIcon,
  EditNote as NoteIcon,
} from "@mui/icons-material";
import { updateLeadStatus } from "../services/leadService";

const CATEGORIES = [
  "Price issue",
  "Already installed",
  "Not interested in solar",
  "Competitor selected",
  "No response",
  "Other",
];

const MIN_CHARS = 10;

export default function NotInterestedModal({ open, onClose, lead, onSuccess }) {
  const [category, setCategory] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open) {
      setCategory(lead?.reason_category || "");
      setExplanation(lead?.remark || "");
      setErrorMsg("");
      setSubmitting(false);
    }
  }, [open, lead]);

  const charCount = useMemo(() => {
    if (!explanation) return 0;
    return explanation.replace(/\s+/g, "").length;
  }, [explanation]);

  const isCountMet = charCount >= MIN_CHARS;
  const progressPercent = Math.min(100, Math.round((charCount / MIN_CHARS) * 100));
  const isOther = category === "Other";

  const isSaveDisabled = !category || !isCountMet || submitting;

  const handleSubmit = async () => {
    if (!lead?.id) return;
    if (!category) {
      setErrorMsg("Please select a reason category.");
      return;
    }
    if (charCount < MIN_CHARS) {
      setErrorMsg(`Minimum ${MIN_CHARS} alphabets/characters required. Currently at ${charCount}.`);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      await updateLeadStatus(lead.id, {
        status: "Not Interested",
        reason_category: category,
        remark: explanation.trim(),
      });
      if (onSuccess) {
        onSuccess({
          status: "Not Interested",
          reason_category: category,
          remark: explanation.trim(),
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to update lead status to Not Interested.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 24px 48px -12px rgba(15, 23, 42, 0.25)",
          overflow: "hidden",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.2,
          background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: "10px",
              bgcolor: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CancelIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>
              Mark as Not Interested
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.85)", fontSize: "0.75rem" }}>
              Strict quality validation • 10 to 50 words required
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={onClose}
          disabled={submitting}
          size="small"
          sx={{ color: "rgba(255, 255, 255, 0.8)", "&:hover": { color: "#FFF", bgcolor: "rgba(255, 255, 255, 0.15)" } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: "#F8FAFC" }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px", fontSize: "0.82rem" }}>
            {errorMsg}
          </Alert>
        )}

        {/* Lead Reference Badge */}
        {lead && (
          <Box
            sx={{
              p: 1.5,
              mb: 2.5,
              borderRadius: "10px",
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: "0.7rem", color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>
                Target Lead
              </Typography>
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 800, color: "#1E293B" }}>
                {lead.customer_name || "N/A"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={lead.lead_code || `#${lead.id}`}
                size="small"
                sx={{ fontWeight: 700, bgcolor: "#F1F5F9", color: "#334155", fontSize: "0.75rem" }}
              />
              <Chip
                label={`Current: ${lead.status || "New Lead"}`}
                size="small"
                sx={{ fontWeight: 600, bgcolor: "#FEF2F2", color: "#DC2626", fontSize: "0.75rem" }}
              />
            </Stack>
          </Box>
        )}

        {/* Step 1: Reason Category Dropdown */}
        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.8 }}>
            <ListIcon sx={{ fontSize: 18, color: "#EF4444" }} />
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#1E293B", textTransform: "uppercase" }}>
              Reason Category <span style={{ color: "#EF4444" }}>*</span>
            </Typography>
          </Stack>
          <Select
            fullWidth
            size="small"
            displayEmpty
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            sx={{
              borderRadius: "10px",
              bgcolor: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 600,
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E1" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94A3B8" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#EF4444" },
            }}
          >
            <MenuItem value="" disabled sx={{ fontSize: "0.85rem", color: "#94A3B8" }}>
              Select a reason category (compulsory)
            </MenuItem>
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat} sx={{ fontSize: "0.85rem", py: 1 }}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* Other Notice if selected */}
        {isOther && (
          <Alert
            severity="warning"
            icon={<WarningIcon fontSize="small" />}
            sx={{
              mb: 2.5,
              borderRadius: "10px",
              bgcolor: "#FFFBEB",
              border: "1px solid #FDE68A",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
          >
            <strong>"Other" Category Selected:</strong> Please provide complete, comprehensive context detailing why
            standard categories do not apply and why the customer opted out.
          </Alert>
        )}

        {/* Step 2: Explanation Textarea + Live 50-Word Counter */}
        <Box sx={{ mb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
            <Stack direction="row" alignItems="center" spacing={0.8}>
              <NoteIcon sx={{ fontSize: 18, color: "#EF4444" }} />
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#1E293B", textTransform: "uppercase" }}>
                Detailed Explanation {isOther ? "(Context Compulsory)" : ""} <span style={{ color: "#EF4444" }}>*</span>
              </Typography>
            </Stack>

            {/* Live Counter Badge */}
            <Chip
              size="small"
              icon={isCountMet ? <CheckIcon sx={{ fontSize: "14px !important" }} /> : undefined}
              label={
                isCountMet
                  ? `${charCount} alphabets (min 10 requirement met)`
                  : `${charCount} / 10 alphabets (${MIN_CHARS - charCount} more required)`
              }
              sx={{
                fontWeight: 700,
                fontSize: "0.72rem",
                bgcolor: isCountMet ? "#DCFCE7" : "#FEE2E2",
                color: isCountMet ? "#15803D" : "#B91C1C",
                border: `1px solid ${isCountMet ? "#86EFAC" : "#FCA5A5"}`,
              }}
            />
          </Stack>

          <TextField
            fullWidth
            multiline
            minRows={4}
            maxRows={8}
            placeholder="Explain customer objection, notes or reason (minimum 10 alphabets/characters)..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: "#FFFFFF",
                fontSize: "0.85rem",
                lineHeight: 1.6,
                "& fieldset": {
                  borderColor: isCountMet ? "#86EFAC" : charCount > 0 ? "#FCA5A5" : "#CBD5E1",
                },
                "&:hover fieldset": { borderColor: isCountMet ? "#22C55E" : "#EF4444" },
                "&.Mui-focused fieldset": { borderColor: isCountMet ? "#16A34A" : "#EF4444" },
              },
            }}
          />

          {/* Progress bar towards 10 chars */}
          <Box sx={{ mt: 1.2 }}>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: "#E2E8F0",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  bgcolor: isCountMet ? "#22C55E" : "#F59E0B",
                  transition: "all 0.2s ease",
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#FFFFFF", borderTop: "1px solid #E2E8F0" }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.85rem",
            color: "#64748B",
            borderRadius: "8px",
            px: 2.5,
            "&:hover": { bgcolor: "#F1F5F9" },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSaveDisabled}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.85rem",
            borderRadius: "8px",
            px: 3,
            py: 1,
            bgcolor: "#EF4444",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
            "&:hover": { bgcolor: "#DC2626" },
            "&.Mui-disabled": {
              bgcolor: "#CBD5E1",
              color: "#94A3B8",
              boxShadow: "none",
            },
          }}
        >
          {submitting
            ? "Saving..."
            : isCountMet
            ? "Confirm Not Interested"
            : `Write ${MIN_CHARS - charCount} More Alphabets`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
