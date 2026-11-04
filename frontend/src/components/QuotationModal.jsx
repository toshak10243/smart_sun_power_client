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
  InputAdornment,
} from "@mui/material";
import {
  Close as CloseIcon,
  DescriptionRounded as QuotationIcon,
  CurrencyRupeeRounded as RupeeIcon,
  BoltRounded as SolarIcon,
  CalendarTodayRounded as CalendarIcon,
  PersonOutlineRounded as PersonIcon,
  PhoneOutlined as PhoneIcon,
  LocationOnOutlined as LocationIcon,
} from "@mui/icons-material";
import { updateLeadStatus } from "../services/leadService";

export default function QuotationModal({ open, onClose, lead, onSuccess }) {
  const [capacity, setCapacity] = useState("");
  const [amount, setAmount] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

  useEffect(() => {
    if (open && lead) {
      setCapacity(lead.required_kw ? String(lead.required_kw) : "");
      setAmount(
        lead.quotation_amount
          ? String(lead.quotation_amount)
          : lead.deal_amount
          ? String(lead.deal_amount)
          : ""
      );
      // Default next follow-up date to 2 days later or today
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 2);
      const defaultDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(defaultDate);
      setNextDate(lead.next_follow_up_date ? String(lead.next_follow_up_date).slice(0, 10) : defaultDateStr);
      setNotes(lead.remark || "");
      setErrorMsg("");
      setSubmitting(false);
    }
  }, [open, lead, todayStr]);

  const handleSubmit = async () => {
    if (!lead?.id) return;

    if (!capacity || Number(capacity) <= 0) {
      setErrorMsg("Quoted capacity (kW) is mandatory and must be greater than 0.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMsg("Quotation amount (₹) is mandatory and must be greater than 0.");
      return;
    }

    if (!nextDate) {
      setErrorMsg("Next follow-up date is compulsory when sending a quotation.");
      return;
    }

    if (nextDate < todayStr) {
      setErrorMsg("Next follow-up date cannot be in the past. Select today or a future date.");
      return;
    }

    if (!notes.trim()) {
      setErrorMsg("Quotation note / proposal remarks are mandatory.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const payload = {
        status: "Quotation Sent",
        required_kw: Number(capacity),
        quotation_amount: Number(amount),
        next_follow_up_date: nextDate,
        remark: notes.trim(),
        customer_details: {
          quoted_kw: Number(capacity),
          quoted_amount: Number(amount),
          quotation_date: todayStr,
          proposal_note: notes.trim(),
        },
      };

      await updateLeadStatus(lead.id, payload);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to update quotation stage.");
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
          background: "linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)",
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
            <QuotationIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", fontFamily: "'Inter', sans-serif" }}>
              Submit & Send Quotation
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", opacity: 0.9, fontFamily: "'Inter', sans-serif" }}>
              Capacity, Price, Notes & Mandatory Follow-up Date
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
          {/* Lead Summary */}
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
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocationIcon sx={{ fontSize: 18, color: "#64748B" }} />
                  <Typography sx={{ fontSize: "0.8125rem", color: "#64748B" }}>
                    {[lead.city, lead.state].filter(Boolean).join(", ") || "City not set"}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SolarIcon sx={{ fontSize: 18, color: "#F59E0B" }} />
                  <Typography sx={{ fontSize: "0.8125rem", color: "#64748B" }}>
                    Lead Code: <strong>{lead.lead_code || `#${lead.id}`}</strong>
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: "10px", fontSize: "0.8125rem" }}>
              {errorMsg}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
                QUOTED CAPACITY (kW) *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                placeholder="e.g. 5"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SolarIcon sx={{ fontSize: 18, color: "#9333EA" }} />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">kW</InputAdornment>,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
                QUOTED AMOUNT (₹) *
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                placeholder="e.g. 250000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <RupeeIcon sx={{ fontSize: 18, color: "#9333EA" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
                }}
              />
            </Grid>
          </Grid>

          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
              MANDATORY NEXT FOLLOW-UP DATE *
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              inputProps={{ min: todayStr }}
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              InputProps={{
                startAdornment: <CalendarIcon sx={{ fontSize: 18, color: "#9333EA", mr: 1 }} />,
              }}
              helperText="Quotation bhejne ke baad customer feedback lene ki compulsory follow-up date."
              sx={{
                "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
              }}
            />
          </Box>

          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
              QUOTATION NOTE & PROPOSAL SPECS *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="Specify panel brand (e.g. Mono PERC 550W), inverter capacity, structure type, and subsidy details shared with customer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
            bgcolor: "#9333EA",
            "&:hover": { bgcolor: "#7E22CE" },
          }}
        >
          {submitting ? <CircularProgress size={20} color="inherit" /> : "Save Quotation & Schedule"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
