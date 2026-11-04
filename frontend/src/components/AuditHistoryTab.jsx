import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Paper,
  CircularProgress,
  Avatar,
  Divider,
} from "@mui/material";
import {
  HistoryRounded as HistoryIcon,
  EastRounded as ArrowRightIcon,
  PersonOutlineRounded as PersonIcon,
  AccessTimeRounded as TimeIcon,
  CheckCircleOutlineRounded as WonIcon,
  CancelOutlined as LostIcon,
  PlaceOutlined as VisitIcon,
  DescriptionOutlined as QuotationIcon,
  PhoneMissedRounded as MissedCallIcon,
  SyncAltRounded as StatusIcon,
  VerifiedRounded as VerifiedIcon,
  CategoryRounded as CategoryIcon,
  BoltRounded as SolarIcon,
  CurrencyRupeeRounded as RupeeIcon,
} from "@mui/icons-material";
import { getLeadStatusLogs } from "../services/leadService";

const STATUS_COLOR_MAP = {
  "New Lead": { color: "#0284C7", bg: "#E0F2FE", border: "#BAE6FD" },
  Contacted: { color: "#00B5EF", bg: "#E0F7FF", border: "#B9E6FE" },
  "Follow-up Pending": { color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" },
  "Site Visit Scheduled": { color: "#7C3AED", bg: "#EDE9FE", border: "#DDD6FE" },
  "Site Visit Completed": { color: "#059669", bg: "#D1FAE5", border: "#A7F3D0" },
  "Quotation Sent": { color: "#9333EA", bg: "#F3E8FF", border: "#E9D5FF" },
  Negotiation: { color: "#C026D3", bg: "#FCE7F3", border: "#FBCFE8" },
  Won: { color: "#16A34A", bg: "#DCFCE7", border: "#BBF7D0" },
  Lost: { color: "#DC2626", bg: "#FEE2E2", border: "#FECACA" },
  "Not Interested": { color: "#475569", bg: "#F1F5F9", border: "#E2E8F0" },
  "No Response": { color: "#EA580C", bg: "#FFEDD5", border: "#FED7AA" },
};

const ROLE_COLOR_MAP = {
  "Super Admin": { color: "#4338CA", bg: "#EEF2FF" },
  Manager: { color: "#7C3AED", bg: "#EDE9FE" },
  Sales: { color: "#0284C7", bg: "#E0F2FE" },
};

const getStatusStyle = (status) =>
  STATUS_COLOR_MAP[status] || { color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" };

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const parseCustomerDetails = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export default function AuditHistoryTab({ leadId, initialLogs = null }) {
  const [logs, setLogs] = useState(initialLogs || []);
  const [loading, setLoading] = useState(!initialLogs && Boolean(leadId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!leadId) return;
    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getLeadStatusLogs(leadId);
        if (isMounted) {
          setLogs(res?.data || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load audit history:", err);
          setError("Failed to load audit trail history.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, [leadId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, gap: 1.5 }}>
        <CircularProgress size={28} sx={{ color: "#00B5EF" }} />
        <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", fontFamily: "'Inter', sans-serif" }}>
          Loading status transition audit trail...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: "center", color: "#DC2626", fontSize: "0.8125rem" }}>
        {error}
      </Box>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 6, px: 2 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "14px",
            bgcolor: "#F1F5F9",
            color: "#64748B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 1.5,
          }}
        >
          <HistoryIcon sx={{ fontSize: 26 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#1E293B", mb: 0.5, fontFamily: "'Inter', sans-serif" }}>
          No Status Transitions Recorded
        </Typography>
        <Typography sx={{ fontSize: "0.8125rem", color: "#64748B", maxWidth: 320, mx: "auto", fontFamily: "'Inter', sans-serif" }}>
          Whenever a lead is moved through the pipeline, stage transitions and remarks will appear in this timeline.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", pl: { xs: 1.5, sm: 2 }, pr: 1, py: 1 }}>
      {/* Vertical Timeline Guide Line */}
      <Box
        sx={{
          position: "absolute",
          left: { xs: 26, sm: 30 },
          top: 16,
          bottom: 16,
          width: 2,
          bgcolor: "#E2E8F0",
          zIndex: 0,
        }}
      />

      <Stack spacing={2.5}>
        {logs.map((log, index) => {
          const newStatus = log.new_status || log.new_value || log.status || log.action_type || "Updated";
          const oldStatus = log.old_status || log.old_value || "";
          const remarksText = log.remarks || log.remark || "";
          const oldStyle = getStatusStyle(oldStatus);
          const newStyle = getStatusStyle(newStatus);
          const roleInfo = ROLE_COLOR_MAP[log.changed_by_role || log.performed_by_role] || { color: "#475569", bg: "#F1F5F9" };
          const detailsObj = parseCustomerDetails(log.customer_details);

          // Word count check for 50-word validation display
          const wordCount = remarksText
            ? remarksText.trim().split(/\s+/).filter(Boolean).length
            : 0;

          return (
            <Box key={log.id || index} sx={{ position: "relative", zIndex: 1 }}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                {/* Timeline Dot Icon */}
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: newStyle.bg,
                    border: `2px solid ${newStyle.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: newStyle.color,
                    flexShrink: 0,
                    mt: 0.5,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  }}
                >
                  {newStatus === "Won" ? (
                    <WonIcon sx={{ fontSize: 18 }} />
                  ) : newStatus === "Not Interested" || newStatus === "Lost" ? (
                    <LostIcon sx={{ fontSize: 18 }} />
                  ) : newStatus.includes("Site Visit") ? (
                    <VisitIcon sx={{ fontSize: 18 }} />
                  ) : newStatus === "Quotation Sent" ? (
                    <QuotationIcon sx={{ fontSize: 18 }} />
                  ) : newStatus === "No Response" ? (
                    <MissedCallIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <StatusIcon sx={{ fontSize: 18 }} />
                  )}
                </Box>

                {/* Timeline Content Card */}
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      borderColor: "#CBD5E1",
                      boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
                    },
                  }}
                >
                  {/* Card Header: User, Role, and Timestamp */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 1,
                      mb: 1.2,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          bgcolor: roleInfo.bg,
                          color: roleInfo.color,
                        }}
                      >
                        {(log.changed_by_name || log.performed_by_name) ? (log.changed_by_name || log.performed_by_name)[0].toUpperCase() : "U"}
                      </Avatar>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#0F172A", fontFamily: "'Inter', sans-serif" }}>
                        {log.changed_by_name || log.performed_by_name || "System"}
                      </Typography>
                      {(log.changed_by_role || log.performed_by_role) && (
                        <Chip
                          label={log.changed_by_role || log.performed_by_role}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            bgcolor: roleInfo.bg,
                            color: roleInfo.color,
                            borderRadius: "6px",
                          }}
                        />
                      )}
                    </Stack>

                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <TimeIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
                      <Typography sx={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>
                        {formatDateTime(log.created_at || log.updated_at)}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Status Transition Row: Old -> New */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                      mb: 1.5,
                      p: 1.2,
                      borderRadius: "10px",
                      bgcolor: "#F8FAFC",
                      border: "1px solid #EDF2F7",
                    }}
                  >
                    <Chip
                      label={oldStatus || "New Lead"}
                      size="small"
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        bgcolor: oldStyle.bg,
                        color: oldStyle.color,
                        border: `1px solid ${oldStyle.border}`,
                        borderRadius: "8px",
                      }}
                    />
                    <ArrowRightIcon sx={{ fontSize: 18, color: "#94A3B8" }} />
                    <Chip
                      label={newStatus}
                      size="small"
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        bgcolor: newStyle.bg,
                        color: newStyle.color,
                        border: `1px solid ${newStyle.border}`,
                        borderRadius: "8px",
                      }}
                    />

                    {log.reason_category && (
                      <Chip
                        icon={<CategoryIcon sx={{ fontSize: "14px !important" }} />}
                        label={`Reason: ${log.reason_category}`}
                        size="small"
                        sx={{
                          ml: "auto",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          bgcolor: "#FEF2F2",
                          color: "#DC2626",
                          border: "1px solid #FECACA",
                          borderRadius: "8px",
                        }}
                      />
                    )}
                  </Box>

                  {/* Stage Details / Structured Metrics (Capacity, Deal Amount, Payment) */}
                  {(log.deal_amount || log.system_capacity_kw || log.payment_status || detailsObj) && (
                    <Box sx={{ mb: 1.2 }}>
                      <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {log.system_capacity_kw && (
                          <Chip
                            icon={<SolarIcon sx={{ fontSize: "14px !important", color: "#D97706" }} />}
                            label={`${Number(log.system_capacity_kw)} kW`}
                            size="small"
                            sx={{ fontSize: "0.72rem", fontWeight: 600, bgcolor: "#FEF3C7", color: "#92400E" }}
                          />
                        )}
                        {log.deal_amount && (
                          <Chip
                            icon={<RupeeIcon sx={{ fontSize: "14px !important", color: "#16A34A" }} />}
                            label={`₹${Number(log.deal_amount).toLocaleString("en-IN")}`}
                            size="small"
                            sx={{ fontSize: "0.72rem", fontWeight: 700, bgcolor: "#DCFCE7", color: "#166534" }}
                          />
                        )}
                        {log.payment_status && (
                          <Chip
                            label={`Payment: ${log.payment_status}`}
                            size="small"
                            sx={{ fontSize: "0.72rem", fontWeight: 600, bgcolor: "#E0F2FE", color: "#0369A1" }}
                          />
                        )}
                        {detailsObj?.visit_outcome && (
                          <Chip
                            label={`Outcome: ${detailsObj.visit_outcome}`}
                            size="small"
                            sx={{ fontSize: "0.72rem", fontWeight: 600, bgcolor: "#EDE9FE", color: "#6D28D9" }}
                          />
                        )}
                        {detailsObj?.next_action && (
                          <Chip
                            label={`Next: ${detailsObj.next_action}`}
                            size="small"
                            sx={{ fontSize: "0.72rem", fontWeight: 600, bgcolor: "#F1F5F9", color: "#475569" }}
                          />
                        )}
                        {detailsObj?.call_attempts && (
                          <Chip
                            label={`Attempt #${detailsObj.call_attempts}`}
                            size="small"
                            sx={{ fontSize: "0.72rem", fontWeight: 600, bgcolor: "#FFEDD5", color: "#C2410C" }}
                          />
                        )}
                      </Stack>
                    </Box>
                  )}

                  {/* Remarks & Explanations */}
                  {remarksText && (
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "10px",
                        bgcolor: newStatus === "Not Interested" ? "#FFFBF0" : "#F8FAFC",
                        border: `1px solid ${newStatus === "Not Interested" ? "#FEF3C7" : "#EDF2F7"}`,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                        <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Remarks & Recorded Explanation
                        </Typography>
                        {newStatus === "Not Interested" && wordCount >= 50 && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <VerifiedIcon sx={{ fontSize: 14, color: "#16A34A" }} />
                            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#16A34A" }}>
                              {wordCount} words verified
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                      <Typography
                        sx={{
                          fontSize: "0.8125rem",
                          color: "#1E293B",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {remarksText}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
