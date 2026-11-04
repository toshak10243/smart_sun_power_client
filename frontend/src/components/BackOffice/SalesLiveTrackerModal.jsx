import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Stack,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  TimelineRounded as TimelineIcon,
  ScheduleRounded as TimerIcon,
  CheckCircleRounded as CheckIcon,
  PauseCircleOutlineRounded as HoldIcon,
  CancelOutlined as CancelIcon,
} from "@mui/icons-material";
import { getSalesTracker } from "../../services/projectFileService";

const STAGES_LIST = [
  "File Online",
  "Loan 1st Check",
  "Offline File",
  "Meter Application Photo",
  "Pre-Install Payment",
  "Installation Work",
  "Post-Install Payment",
  "Online Installation Details",
  "Work Completion at AEN",
  "Loan 2nd Check",
  "Meter Installed",
  "Plant Start",
  "WiFi Connected",
  "Customer Explanation",
  "Payment Ledger Verification",
  "Final Closing",
  "Subsidy Redeemed",
];

export default function SalesLiveTrackerModal({ open, onClose, leadId, leadName, onInitProjectFile }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (open && leadId) {
      setLoading(true);
      setErrorMsg("");
      getSalesTracker(leadId)
        .then((res) => {
          setData(res);
        })
        .catch((err) => {
          setErrorMsg(err.response?.data?.message || "No back-office project file found for this lead yet.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, leadId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3 } },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1, bgcolor: "#E0F2FE", color: "#00B5EF", borderRadius: 2, display: "flex" }}>
            <TimelineIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#0B3A63">
              Live Back-Office Stage Tracker
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Lead: <b>{leadName}</b> {data?.file_number ? `(${data.file_number})` : ""}
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: "75vh" }}>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress size={36} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Loading live pipeline tracker...
            </Typography>
          </Box>
        ) : errorMsg ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Alert severity="info" sx={{ borderRadius: 2, mb: 2.5, textAlign: "left" }}>
              {errorMsg}
            </Alert>
            {onInitProjectFile && (
              <Button
                variant="contained"
                onClick={() => {
                  onClose();
                  onInitProjectFile();
                }}
                sx={{
                  fontWeight: 700,
                  bgcolor: "#00B5EF",
                  "&:hover": { bgcolor: "#0095c5" },
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                }}
              >
                Complete Intake Form & Initiate 17-Stage File →
              </Button>
            )}
          </Box>
        ) : data ? (
          <Box>
            {/* Financial Summary */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
                gap: 1.5,
                mb: 3,
              }}
            >
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: 2, border: "1px solid #E2E8F0" }}>
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase" }}>
                  Total Project Cost
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#0B3A63" sx={{ mt: 0.5 }}>
                  ₹ {Number(data.total_project_cost || 0).toLocaleString("en-IN")}
                </Typography>
              </Paper>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#F0FDF4", borderRadius: 2, border: "1px solid #BBF7D0" }}>
                <Typography variant="caption" sx={{ color: "#166534", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase" }}>
                  Total Collected
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#16A34A" sx={{ mt: 0.5 }}>
                  ₹ {Number(data.total_paid || 0).toLocaleString("en-IN")}
                </Typography>
              </Paper>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#FEF2F2", borderRadius: 2, border: "1px solid #FECACA" }}>
                <Typography variant="caption" sx={{ color: "#991B1B", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase" }}>
                  Balance Due
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#DC2626" sx={{ mt: 0.5 }}>
                  ₹ {Number(data.balance_due || 0).toLocaleString("en-IN")}
                </Typography>
              </Paper>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: "#F8FAFC", borderRadius: 2, border: "1px solid #E2E8F0" }}>
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase" }}>
                  File Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={data.file_status}
                    color={
                      data.file_status === "Active"
                        ? "primary"
                        : data.file_status === "On Hold"
                        ? "warning"
                        : "success"
                    }
                    sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                  />
                </Box>
              </Paper>
            </Box>

            {/* Stepper of 17 Stages */}
            <Typography variant="subtitle2" fontWeight={800} color="#0B3A63" sx={{ mb: 2 }}>
              Current Pipeline Progress (Stage {data.current_stage} / 17)
            </Typography>

            <Stepper activeStep={Math.max(0, data.current_stage - 1)} orientation="vertical">
              {STAGES_LIST.map((label, index) => {
                const stageNum = index + 1;
                const isCurrent = stageNum === data.current_stage;
                const isPast = stageNum < data.current_stage;
                const matchingLog = data.timeline?.find((l) => l.stage_number === stageNum);

                return (
                  <Step key={label} completed={isPast}>
                    <StepLabel
                      StepIconProps={{
                        sx: {
                          "&.Mui-completed": { color: "#16A34A" },
                          "&.Mui-active": { color: "#00B5EF" },
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={isCurrent ? 800 : isPast ? 600 : 400}>
                          {stageNum}. {label}
                        </Typography>
                        {isCurrent && (
                          <Chip
                            size="small"
                            label={data.file_status === "On Hold" ? "ON HOLD" : "IN PROGRESS"}
                            color={data.file_status === "On Hold" ? "warning" : "primary"}
                            sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }}
                          />
                        )}
                      </Stack>
                    </StepLabel>
                    <StepContent>
                      {matchingLog && (
                        <Box sx={{ p: 1, bgcolor: "#F8FAFC", borderRadius: 1.5, mt: 0.5, borderLeft: "3px solid #00B5EF" }}>
                          <Typography variant="caption" color="text.secondary">
                            Status: <b>{matchingLog.action_taken}</b> by {matchingLog.performed_by_name} ({matchingLog.performed_by_role})
                          </Typography>
                          {matchingLog.remarks && (
                            <Typography variant="body2" sx={{ fontStyle: "italic", color: "#B91C1C", mt: 0.5 }}>
                              Hold Reason: "{matchingLog.remarks}"
                            </Typography>
                          )}
                        </Box>
                      )}
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
