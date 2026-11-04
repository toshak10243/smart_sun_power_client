import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
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
} from "@mui/material";
import {
  Close as CloseIcon,
  WarningAmberRounded as WarningIcon,
  PauseCircleOutlineRounded as HoldIcon,
  CancelOutlined as CancelIcon,
} from "@mui/icons-material";

export default function RemarkValidationModal({
  open,
  onClose,
  action, // 'Hold' | 'Cancel'
  onSubmit,
  loading = false,
}) {
  const [remarks, setRemarks] = useState("");

  const words = remarks
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordCount = remarks.trim() === "" ? 0 : words.length;
  const isSatisfied = wordCount >= 10;

  const handleClose = () => {
    if (!loading) {
      setRemarks("");
      onClose();
    }
  };

  const handleConfirm = () => {
    if (!isSatisfied) return;
    onSubmit(remarks.trim());
  };

  const isHold = action === "Hold";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: isHold ? "warning.light" : "error.light",
              color: isHold ? "warning.dark" : "error.dark",
              display: "flex",
            }}
          >
            {isHold ? <HoldIcon /> : <CancelIcon />}
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {isHold ? "Put File On Hold" : "Cancel Project File"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Strict Quality & Audit Rule: Minimum 10 words reason mandatory
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={handleClose} disabled={loading}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <Alert severity={isHold ? "warning" : "error"} sx={{ mb: 2.5, borderRadius: 2 }}>
          {isHold
            ? "File ko Hold par rakhne se pehle detail reason likhein taaki sales rep customer ko clear kar sake."
            : "File Cancel karne par ye process ruk jayega. Please specify complete reason."}
        </Alert>

        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Yahan detailed reason likhein (e.g. Customer unavailable, Discom Demand Note document unclear, Bank sanction letter pending...)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={loading}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: isSatisfied ? "success.main" : "error.main",
            }}
          >
            Words: {wordCount} / 10 required
          </Typography>
          {!isSatisfied && (
            <Typography variant="caption" color="text.secondary">
              Need {Math.max(0, 10 - wordCount)} more words
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit" disabled={loading} sx={{ borderRadius: 2 }}>
          Dismiss
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={isHold ? "warning" : "error"}
          disabled={!isSatisfied || loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          {loading ? "Saving..." : isHold ? "Confirm Hold" : "Confirm Cancel"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
