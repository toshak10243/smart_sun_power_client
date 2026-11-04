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
  PlaceRounded as VisitIcon,
  CalendarTodayRounded as CalendarIcon,
  AccessTimeRounded as TimeIcon,
  TaskAltRounded as CompletedIcon,
  PersonOutlineRounded as PersonIcon,
  PhoneOutlined as PhoneIcon,
  LocationOnOutlined as LocationIcon,
  BoltRounded as SolarIcon,
  EngineeringRounded as EngineerIcon,
} from "@mui/icons-material";
import { updateLeadStatus } from "../services/leadService";

const VISIT_OUTCOME_OPTIONS = [
  { value: "Feasible", label: "Feasible (Good Rooftop & Sun Exposure)", color: "#16A34A" },
  { value: "Space Issue / Shadow", label: "Space Issue / Partial Shadow Area", color: "#D97706" },
  { value: "High Interest", label: "High Interest (Ready for Quotation)", color: "#2563EB" },
  { value: "Quotation Requested", label: "Quotation Requested on Site", color: "#9333EA" },
  { value: "Non-Feasible", label: "Non-Feasible (Structural / Roof Limitation)", color: "#DC2626" },
  { value: "Other", label: "Other (Explained in Details)", color: "#475569" },
];

const NEXT_ACTION_OPTIONS = [
  "Send Quotation",
  "Negotiation",
  "Follow-up Required",
  "Revise System Size",
  "Customer Reviewing Proposal",
  "Not Interested",
];

const TIME_PRESETS = ["10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];

export default function SiteVisitModal({
  open,
  onClose,
  lead,
  mode = "schedule", // "schedule" for Site Visit Scheduled, "complete" for Site Visit Completed
  onSuccess,
}) {
  const isScheduleMode = mode === "schedule" || mode === "Site Visit Scheduled";

  // Schedule mode fields
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");

  // Completed mode fields
  const [visitOutcome, setVisitOutcome] = useState("Feasible");
  const [customerResponse, setCustomerResponse] = useState("");
  const [nextAction, setNextAction] = useState("Send Quotation");
  const [completionNotes, setCompletionNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

  useEffect(() => {
    if (open && lead) {
      if (isScheduleMode) {
        setVisitDate(lead.site_visit_date ? String(lead.site_visit_date).slice(0, 10) : todayStr);
        setVisitTime(lead.site_visit_time || "11:30 AM");
        setScheduleNotes(lead.remark || "");
      } else {
        setVisitOutcome("Feasible");
        setCustomerResponse("");
        setNextAction("Send Quotation");
        setCompletionNotes("");
        setNextFollowUpDate(todayStr);
      }
      setErrorMsg("");
      setSubmitting(false);
    }
  }, [open, lead, isScheduleMode, todayStr]);

  const validateSchedule = () => {
    if (!visitDate) return "Visit date is mandatory.";
    if (visitDate < todayStr) return "Visit date cannot be in the past.";
    if (!visitTime.trim()) return "Visit time is mandatory.";
    if (!scheduleNotes.trim()) return "Notes / instructions are mandatory for scheduling a site visit.";
    return null;
  };

  const validateCompleted = () => {
    if (!visitOutcome) return "Visit outcome is mandatory.";
    if (!customerResponse.trim()) return "Customer reaction/response details are mandatory.";
    if (!nextAction) return "Next action is mandatory.";
    if (!completionNotes.trim()) return "Detailed visit summary notes are mandatory.";
    return null;
  };

  const handleSubmit = async () => {
    if (!lead?.id) return;

    const error = isScheduleMode ? validateSchedule() : validateCompleted();
    if (error) {
      setErrorMsg(error);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      if (isScheduleMode) {
        const payload = {
          status: "Site Visit Scheduled",
          site_visit_date: visitDate,
          site_visit_time: visitTime,
          remark: scheduleNotes.trim(),
        };
        await updateLeadStatus(lead.id, payload);
      } else {
        const fullRemark = `[Visit Completed - ${visitOutcome}] Outcome: ${visitOutcome} | Response: ${customerResponse.trim()} | Next Action: ${nextAction} | Summary: ${completionNotes.trim()}`;
        const payload = {
          status: "Site Visit Completed",
          visit_outcome: visitOutcome,
          customer_response: customerResponse.trim(),
          next_action: nextAction,
          remark: fullRemark,
          next_follow_up_date: nextFollowUpDate || undefined,
          customer_details: {
            visit_outcome: visitOutcome,
            customer_response: customerResponse.trim(),
            next_action: nextAction,
            notes: completionNotes.trim(),
          },
        };
        await updateLeadStatus(lead.id, payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to update site visit workflow stage.");
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
      {/* Top Banner Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          background: isScheduleMode
            ? "linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)"
            : "linear-gradient(135deg, #059669 0%, #10B981 100%)",
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
            {isScheduleMode ? (
              <VisitIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />
            ) : (
              <CompletedIcon sx={{ fontSize: 24, color: "#FFFFFF" }} />
            )}
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", fontFamily: "'Inter', sans-serif" }}>
              {isScheduleMode ? "Schedule Site Visit" : "Log Site Visit Completion"}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", opacity: 0.9, fontFamily: "'Inter', sans-serif" }}>
              {isScheduleMode
                ? "Compulsory Date, Time & Instructions"
                : "Record Visit Outcome, Customer Response & Next Action"}
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
          {/* Customer Overview Card */}
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
                    Req: <strong>{lead.required_kw ? `${lead.required_kw} kW` : "N/A"}</strong> ({lead.solar_requirement || "Residential"})
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

          {isScheduleMode ? (
            /* --- SCHEDULE MODE FORM --- */
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
                    VISIT DATE *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={visitDate}
                    inputProps={{ min: todayStr }}
                    onChange={(e) => setVisitDate(e.target.value)}
                    InputProps={{
                      startAdornment: <CalendarIcon sx={{ fontSize: 18, color: "#7C3AED", mr: 1 }} />,
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
                    VISIT TIME *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 11:30 AM"
                    value={visitTime}
                    onChange={(e) => setVisitTime(e.target.value)}
                    InputProps={{
                      startAdornment: <TimeIcon sx={{ fontSize: 18, color: "#7C3AED", mr: 1 }} />,
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
                    }}
                  />
                </Grid>
              </Grid>

              {/* Time Presets */}
              <Box>
                <Typography sx={{ fontSize: "0.7rem", color: "#64748B", mb: 0.8, fontWeight: 600 }}>
                  QUICK TIME PRESETS:
                </Typography>
                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                  {TIME_PRESETS.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      size="small"
                      clickable
                      onClick={() => setVisitTime(t)}
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: visitTime === t ? 700 : 500,
                        bgcolor: visitTime === t ? "#7C3AED" : "#EDE9FE",
                        color: visitTime === t ? "#FFFFFF" : "#6D28D9",
                        "&:hover": { bgcolor: "#7C3AED", color: "#FFFFFF" },
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
                  SITE VISIT INSTRUCTIONS / ROOFTOP NOTES *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  placeholder="Mention rooftop access details, meter box location, customer availability instructions..."
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
                  }}
                />
              </Box>
            </Stack>
          ) : (
            /* --- COMPLETED MODE FORM --- */
            <Stack spacing={2}>
              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
                  VISIT OUTCOME *
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={visitOutcome}
                  onChange={(e) => setVisitOutcome(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
                  }}
                >
                  {VISIT_OUTCOME_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "0.85rem", py: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: opt.color }} />
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: 500 }}>{opt.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
                  CUSTOMER RESPONSE & SENTIMENT *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  placeholder="What was customer's reaction? Any questions about subsidy, loan, or brands raised?"
                  value={customerResponse}
                  onChange={(e) => setCustomerResponse(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
                  }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
                    NEXT ACTION *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
                    }}
                  >
                    {NEXT_ACTION_OPTIONS.map((action) => (
                      <MenuItem key={action} value={action} sx={{ fontSize: "0.85rem" }}>
                        {action}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
                    NEXT FOLLOW-UP DATE
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    inputProps={{ min: todayStr }}
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
                    }}
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", mb: 0.6 }}>
                  DETAILED VISIT SUMMARY & TECHNICAL FINDINGS *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  placeholder="Record shadow analysis, roof structure (RCC/Tin Shed), cable distance, and inverter placement notes..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: "#FFFFFF", borderRadius: "10px" },
                  }}
                />
              </Box>
            </Stack>
          )}
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
            bgcolor: isScheduleMode ? "#7C3AED" : "#059669",
            "&:hover": { bgcolor: isScheduleMode ? "#6D28D9" : "#047857" },
          }}
        >
          {submitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : isScheduleMode ? (
            "Confirm Site Visit"
          ) : (
            "Complete & Save Visit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
