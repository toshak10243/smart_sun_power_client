// ============================================================================
// OPERATIONS COMMAND CENTER & ANALYTICS DASHBOARD
// Clean executive UI strictly matching Leads & Today's Follow-up standards
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Card,
  Stack,
  Button,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Breadcrumbs,
} from "@mui/material";

// Icons (Zero Unicode Emojis - Vector SVG Only)
import {
  SpeedRounded as SpeedIcon,
  AccountBalanceWalletRounded as PaymentIcon,
  PauseCircleOutlineRounded as HoldIcon,
  CheckCircleOutlineRounded as CompletedIcon,
  WarningAmberRounded as WarningIcon,
  AssignmentTurnedInRounded as TaskIcon,
  RefreshRounded as RefreshIcon,
  ArrowForwardRounded as ArrowForwardIcon,
  SearchRounded as SearchIcon,
  AccountTreeRounded as FunnelIcon,
  HistoryRounded as HistoryIcon,
  AssessmentRounded as AssessmentIcon,
  AccessTimeRounded as AccessTimeIcon,
  OpenInNewRounded as OpenInNewIcon,
  HomeOutlined as HomeOutlinedIcon,
  NavigateNextRounded as NavigateNextRoundedIcon,
  VerifiedRounded as VerifiedIcon,
  CheckCircleRounded as CheckCircleRoundedIcon,
  PendingActionsRounded as PendingActionsIcon,
  PlayCircleFilledRounded as PlayIcon,
} from "@mui/icons-material";

import { getDashboardStats } from "../../services/projectFileService";
import { useAuth } from "../../context/AuthContext";

// Color Tokens exactly matching Leads & Today's Follow-up
const COLORS = {
  primary: "#0B3A63",       // Deep Solar Navy
  primaryHover: "#082F52",
  accent: "#005BAC",        // Royal Blue
  sky: "#38BDF8",
  primarySoft: "#E0F2FE",   // Soft Sky
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  purple: "#7C3AED",
  purpleSoft: "#EDE9FE",
};

// Desk Metadata for 3x2 grid distribution
const DESK_CONFIG = [
  { role: "Back Office Online", name: "Online Desk", taskDesc: "Online Filing & Modification", color: "#005BAC" },
  { role: "Loan Officer", name: "Loan Desk", taskDesc: "Bank Sanctions & Disbursement", color: "#2563EB" },
  { role: "Back Office Field", name: "Field Desk", taskDesc: "Discom AEN & Meter Photos", color: "#EA580C" },
  { role: "Accounts", name: "Accounts Desk", taskDesc: "Pre & Post Install Clearances", color: "#16A34A" },
  { role: "Installation Lead", name: "Installation Desk", taskDesc: "Site Solar Mounting", color: "#D97706" },
  { role: "Portal Entry", name: "Portal Desk", taskDesc: "National Portal & Subsidy", color: "#7C3AED" },
];

export default function OperationsAnalyticsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Tabs: 0: 17-Stage Funnel, 1: Live Activity Feed, 2: SLA Escalations
  const [activeTab, setActiveTab] = useState(0);

  // Filters & Searches
  const [selectedDesk, setSelectedDesk] = useState("all");
  const [stageSearch, setStageSearch] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityActionFilter, setActivityActionFilter] = useState("all");
  const [breachSearch, setBreachSearch] = useState("");

  // Pagination for activity logs
  const [activityPage, setActivityPage] = useState(0);
  const [activityRowsPerPage, setActivityRowsPerPage] = useState(8);

  const loadStats = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getDashboardStats();
      setData(res);
    } catch (err) {
      console.error("Operations analytics error:", err);
      setErrorMsg(
        err.response?.data?.message || err.message || "Failed to load dashboard metrics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const summary = data?.summary || {};
  const deskDist = data?.desk_distribution || [];
  const stages = data?.stage_breakdown || [];
  const activity = data?.recent_activity || [];
  const breaches = data?.sla_breaches || [];

  // Filtered 17-Stage Funnel List (Vertical List)
  const filteredStages = useMemo(() => {
    return stages.filter((st) => {
      const matchDesk =
        selectedDesk === "all" ||
        (st.assigned_role &&
          st.assigned_role.toLowerCase().trim() === selectedDesk.toLowerCase().trim());
      const matchSearch =
        !stageSearch ||
        st.stage_name.toLowerCase().includes(stageSearch.toLowerCase()) ||
        String(st.stage_number).includes(stageSearch) ||
        (st.assigned_role && st.assigned_role.toLowerCase().includes(stageSearch.toLowerCase()));
      return matchDesk && matchSearch;
    });
  }, [stages, selectedDesk, stageSearch]);

  // Activity Feed filtered list
  const filteredActivity = useMemo(() => {
    return activity.filter((item) => {
      const matchAction =
        activityActionFilter === "all" ||
        (item.action_taken &&
          item.action_taken.toLowerCase() === activityActionFilter.toLowerCase());
      const query = activitySearch.toLowerCase();
      const matchSearch =
        !query ||
        (item.file_number && item.file_number.toLowerCase().includes(query)) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(query)) ||
        (item.performed_by_name && item.performed_by_name.toLowerCase().includes(query)) ||
        (item.remarks && item.remarks.toLowerCase().includes(query)) ||
        (item.stage_name && item.stage_name.toLowerCase().includes(query));
      return matchAction && matchSearch;
    });
  }, [activity, activityActionFilter, activitySearch]);

  // SLA Breaches filtered list
  const filteredBreaches = useMemo(() => {
    return breaches.filter((b) => {
      const q = breachSearch.toLowerCase();
      return (
        !q ||
        (b.file_number && b.file_number.toLowerCase().includes(q)) ||
        (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
        (b.stage_name && b.stage_name.toLowerCase().includes(q)) ||
        (b.assigned_role && b.assigned_role.toLowerCase().includes(q))
      );
    });
  }, [breaches, breachSearch]);

  // SLA Turnaround calculations
  const safeCount = Math.max(
    0,
    (summary.active_files || 0) - (summary.hold_files || 0) - (breaches.length || 0)
  );
  const slaCompliancePct =
    summary.active_files > 0
      ? Math.round((safeCount / summary.active_files) * 100)
      : 100;

  // Jump to SLA Escalations Tab and scroll smoothly
  const handleReviewEscalations = () => {
    setActiveTab(2);
    setTimeout(() => {
      const el = document.getElementById("analytics-hub-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  if (loading) {
    return (
      <Box
        style={{ zoom: 0.9 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "75vh",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <CircularProgress size={42} sx={{ color: COLORS.accent, mb: 2 }} />
        <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: COLORS.primary }}>
          Loading Operations Radar & Metrics...
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, mt: 0.5 }}>
          Fetching back-office team workload, 17-stage throughput & SLA statuses.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      style={{ zoom: 0.9 }}
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        maxWidth: 1540,
        mx: "auto",
        fontFamily: "'Inter', sans-serif",
        backgroundColor: COLORS.bg,
        minHeight: "100vh",
      }}
    >
      {/* 1. BREADCRUMBS NAVIGATION */}
      <Breadcrumbs
        separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.85rem", color: COLORS.textMuted }} />}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" gap={0.5}>
          <HomeOutlinedIcon sx={{ fontSize: "0.95rem", color: COLORS.textSecondary }} />
          <Typography
            sx={{
              fontSize: "0.82rem",
              fontWeight: 500,
              color: COLORS.textSecondary,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Dashboard
          </Typography>
        </Stack>
        <Typography
          sx={{
            fontSize: "0.82rem",
            fontWeight: 500,
            color: COLORS.textSecondary,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Project Execution
        </Typography>
        <Typography
          sx={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: COLORS.primary,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Operations Analytics
        </Typography>
      </Breadcrumbs>

      {/* 2. TOP HERO HEADER & CONTROLS */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: COLORS.primary,
                letterSpacing: -0.3,
                fontSize: { xs: "1.3rem", md: "1.5rem" },
              }}
            >
              Operations Command Center
            </Typography>
            <Chip
              label="Live Synced"
              size="small"
              icon={
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: COLORS.success,
                    mr: 0.5,
                  }}
                />
              }
              sx={{
                height: 24,
                fontSize: "0.72rem",
                fontWeight: 700,
                backgroundColor: COLORS.successSoft,
                color: COLORS.success,
                border: "1px solid #BBF7D0",
                borderRadius: "10px",
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{ color: COLORS.textSecondary, mt: 0.4, fontSize: "0.82rem" }}
          >
            Real-time file throughput, back-office desk workload, 17-stage funnel & SLA compliance radar.
          </Typography>
        </Box>

        {/* Action Buttons Toolbar */}
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon sx={{ fontSize: "16px !important" }} />}
            onClick={loadStats}
            sx={{
              height: 36,
              px: 1.8,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
              borderColor: COLORS.border,
              color: COLORS.textSecondary,
              backgroundColor: "#FFFFFF",
              "&:hover": {
                backgroundColor: "#F1F5F9",
                borderColor: COLORS.borderStrong,
              },
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: "16px !important" }} />}
            onClick={() => navigate("/back-office")}
            sx={{
              height: 36,
              px: 2,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8125rem",
              backgroundColor: COLORS.accent,
              boxShadow: "0 2px 8px rgba(0, 91, 172, 0.25)",
              "&:hover": {
                backgroundColor: COLORS.primary,
              },
            }}
          >
            Back-Office Task Queue
          </Button>
        </Stack>
      </Box>

      {/* 3. ERROR ALERT */}
      {errorMsg && (
        <Alert
          severity="error"
          sx={{
            mb: 2.5,
            borderRadius: "10px",
            border: "1px solid #FECACA",
            fontSize: "0.82rem",
          }}
        >
          {errorMsg}
        </Alert>
      )}

      {/* 4. SLA BREACH ALERT BANNER (WITH WORKING DIRECT-ACTION BUTTON) */}
      {breaches.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: "12px",
            backgroundColor: "#FEF2F2",
            border: "1px solid #FECACA",
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: COLORS.dangerSoft,
                color: COLORS.danger,
                width: 38,
                height: 38,
                borderRadius: "10px",
              }}
            >
              <WarningIcon sx={{ fontSize: 22 }} />
            </Avatar>
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.88rem",
                  color: "#991B1B",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                SLA Alert: {breaches.length} Project File{breaches.length > 1 ? "s have" : " has"} exceeded standard turnaround time
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: "#B91C1C", mt: 0.2 }}>
                Overdue files:{" "}
                {breaches
                  .slice(0, 3)
                  .map((b) => `${b.file_number} (${b.customer_name} • Stage ${b.current_stage})`)
                  .join(" | ")}
                {breaches.length > 3 && ` +${breaches.length - 3} more`}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            size="small"
            onClick={handleReviewEscalations}
            sx={{
              height: 34,
              px: 2,
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "0.78rem",
              fontWeight: 700,
              backgroundColor: COLORS.danger,
              color: "#FFFFFF",
              whiteSpace: "nowrap",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)",
              "&:hover": { backgroundColor: "#B91C1C" },
            }}
          >
            Review Escalations ({breaches.length})
          </Button>
        </Paper>
      )}

      {/* 5. TOP 5 EXECUTIVE METRIC CARDS (ALL 5 IN ONE ROW SIDE-BY-SIDE) */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 2,
          mb: 3,
          width: "100%",
        }}
      >
        {/* Card 1: Pipeline Volume */}
        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Pipeline Volume
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: COLORS.primary,
                  mt: 0.6,
                  lineHeight: 1.2,
                }}
              >
                ₹ {(Number(summary.total_booked_value || 0) / 100000).toFixed(2)} L
              </Typography>
            </Box>
            <Avatar
              sx={{
                bgcolor: COLORS.primarySoft,
                color: COLORS.accent,
                width: 38,
                height: 38,
                borderRadius: "10px",
              }}
            >
              <PaymentIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted, mt: 1.5, fontWeight: 500 }}>
            {summary.total_files || 0} Total Closed Orders
          </Typography>
        </Card>

        {/* Card 2: Active In-Progress */}
        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Active Pipeline
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: COLORS.accent,
                  mt: 0.6,
                  lineHeight: 1.2,
                }}
              >
                {summary.active_files || 0} Files
              </Typography>
            </Box>
            <Avatar
              sx={{
                bgcolor: "#EFF6FF",
                color: COLORS.accent,
                width: 38,
                height: 38,
                borderRadius: "10px",
              }}
            >
              <TaskIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.accent, mt: 1.5, fontWeight: 600 }}>
            Across 17 workflow stages
          </Typography>
        </Card>

        {/* Card 3: Bottlenecks / On Hold */}
        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Bottlenecks (Hold)
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: COLORS.warning,
                  mt: 0.6,
                  lineHeight: 1.2,
                }}
              >
                {summary.hold_files || 0} Files
              </Typography>
            </Box>
            <Avatar
              sx={{
                bgcolor: COLORS.warningSoft,
                color: COLORS.warning,
                width: 38,
                height: 38,
                borderRadius: "10px",
              }}
            >
              <HoldIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.warning, mt: 1.5, fontWeight: 600 }}>
            Logged with hold remarks
          </Typography>
        </Card>

        {/* Card 4: Collections Verified */}
        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Collections Verified
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: COLORS.success,
                  mt: 0.6,
                  lineHeight: 1.2,
                }}
              >
                ₹ {(Number(summary.total_collected || 0) / 100000).toFixed(2)} L
              </Typography>
            </Box>
            <Avatar
              sx={{
                bgcolor: COLORS.successSoft,
                color: COLORS.success,
                width: 38,
                height: 38,
                borderRadius: "10px",
              }}
            >
              <CompletedIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted, mt: 1.5, fontWeight: 500 }}>
            Pending: ₹ {(Number(summary.total_outstanding || 0) / 100000).toFixed(2)} L
          </Typography>
        </Card>

        {/* Card 5: Commissioned & Completed (Side-by-side with Card 4) */}
        <Card
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Commissioned
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: COLORS.purple,
                  mt: 0.6,
                  lineHeight: 1.2,
                }}
              >
                {summary.completed_files || 0} Files
              </Typography>
            </Box>
            <Avatar
              sx={{
                bgcolor: COLORS.purpleSoft,
                color: COLORS.purple,
                width: 38,
                height: 38,
                borderRadius: "10px",
              }}
            >
              <VerifiedIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.purple, mt: 1.5, fontWeight: 600 }}>
            Completed & subsidy filed
          </Typography>
        </Card>
      </Box>

      {/* 6. WORKLOAD BY DESK: FULL-WIDTH 3 COLUMNS X 2 ROWS GRID (NO EMPTY SPACE) */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: "12px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          mb: 3,
          boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.2 }}>
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "0.95rem",
                color: COLORS.primary,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AssessmentIcon sx={{ fontSize: 20, color: COLORS.accent }} />
              Workload Distribution by Desk
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mt: 0.3 }}>
              Active pending file allocation across back-office operational desks
            </Typography>
          </Box>
          <Chip
            label={`${summary.active_files || 0} Total Active Files`}
            size="small"
            sx={{
              height: 24,
              fontWeight: 700,
              fontSize: "0.72rem",
              backgroundColor: COLORS.primarySoft,
              color: COLORS.accent,
            }}
          />
        </Box>

        {/* 3x2 Grid for 6 Desks */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 2,
            width: "100%",
          }}
        >
          {DESK_CONFIG.map((desk) => {
            const match = deskDist.find((d) => d.assigned_role === desk.role);
            const count = match ? Number(match.count) : 0;
            const totalActive = summary.active_files || 1;
            const pct = Math.min(100, Math.round((count / totalActive) * 100));
            const isFiltered = selectedDesk.toLowerCase() === desk.role.toLowerCase();

            return (
              <Box
                key={desk.role}
                onClick={() => {
                  setSelectedDesk(isFiltered ? "all" : desk.role);
                  setActiveTab(0);
                  const el = document.getElementById("analytics-hub-section");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                sx={{
                  p: 2,
                  borderRadius: "10px",
                  border: `1px solid ${isFiltered ? desk.color : COLORS.border}`,
                  backgroundColor: isFiltered ? `${desk.color}08` : "#F8FAFC",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  "&:hover": {
                    borderColor: desk.color,
                    backgroundColor: `${desk.color}08`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          backgroundColor: desk.color,
                        }}
                      />
                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                        {desk.role}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${count} File(s)`}
                      sx={{
                        height: 22,
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        backgroundColor: `${desk.color}15`,
                        color: desk.color,
                      }}
                    />
                  </Box>

                  <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mb: 1.5 }}>
                    {desk.name} • {desk.taskDesc}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 7,
                        borderRadius: 3.5,
                        backgroundColor: "#E2E8F0",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: desk.color,
                          borderRadius: 3.5,
                        },
                      }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textMuted, width: 34, textAlign: "right" }}>
                    {pct}%
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* 7. SLA HEALTH & COMPLIANCE (FULL-WIDTH 4-METRIC STRIP - NO EMPTY SPACE) */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: "12px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          mb: 3,
          boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "0.95rem",
                color: COLORS.primary,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 20, color: COLORS.accent }} />
              SLA Health & Compliance Radar
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mt: 0.3 }}>
              Turnaround compliance across standard 24-hour and 48-hour operational deadlines
            </Typography>
          </Box>
          <Chip
            label={`${slaCompliancePct}% Compliant`}
            size="small"
            sx={{
              height: 24,
              fontWeight: 700,
              fontSize: "0.72rem",
              backgroundColor: slaCompliancePct > 80 ? COLORS.successSoft : COLORS.warningSoft,
              color: slaCompliancePct > 80 ? COLORS.success : COLORS.warning,
            }}
          />
        </Box>

        {/* 4 Balanced Full-Width Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            width: "100%",
          }}
        >
          {/* Box 1: Compliance Rate */}
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              backgroundColor: "#F8FAFC",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary }}>
                COMPLIANCE SCORE
              </Typography>
              <Chip
                size="small"
                label={slaCompliancePct >= 80 ? "Healthy" : "Needs Action"}
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  backgroundColor: slaCompliancePct >= 80 ? COLORS.successSoft : COLORS.warningSoft,
                  color: slaCompliancePct >= 80 ? COLORS.success : COLORS.warning,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: COLORS.primary }}>
              {slaCompliancePct}%
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, mt: 0.5 }}>
              Files on schedule
            </Typography>
          </Box>

          {/* Box 2: On-Track Files */}
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              backgroundColor: "#F0FDF4",
              border: "1px solid #DCFCE7",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534" }}>
                ON-TRACK FILES (&lt; 24H)
              </Typography>
              <Chip
                size="small"
                label="Safe"
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  backgroundColor: COLORS.success,
                  color: "#FFFFFF",
                }}
              />
            </Box>
            <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: COLORS.success }}>
              {safeCount} Files
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#166534", mt: 0.5 }}>
              Proceeding without delay
            </Typography>
          </Box>

          {/* Box 3: Held Queries */}
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              backgroundColor: "#FFFBEB",
              border: "1px solid #FEF3C7",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400E" }}>
                HELD PENDING QUERIES
              </Typography>
              <Chip
                size="small"
                label="Attention"
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  backgroundColor: COLORS.warning,
                  color: "#FFFFFF",
                }}
              />
            </Box>
            <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: COLORS.warning }}>
              {summary.hold_files || 0} Files
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#92400E", mt: 0.5 }}>
              Hold remark reason logged
            </Typography>
          </Box>

          {/* Box 4: SLA Critical / Overdue */}
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#991B1B" }}>
                SLA OVERDUE (&gt; 48H)
              </Typography>
              <Chip
                size="small"
                label="Escalated"
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  backgroundColor: COLORS.danger,
                  color: "#FFFFFF",
                }}
              />
            </Box>
            <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: COLORS.danger }}>
              {breaches.length || 0} Files
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: "#991B1B", mt: 0.5 }}>
              Requires priority resolution
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 8. DETAILED OPERATIONS HUB (TABS WITH CLEAN CONTINUOUS UNDERLINE) */}
      <Paper
        id="analytics-hub-section"
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
        }}
      >
        {/* TAB BAR WITH CRISP FULL-WIDTH UNDERLINE (PURE CSS - PERFECTLY ALIGNED WITH ACTIVE TAB) */}
        <Box
          sx={{
            px: 2.5,
            pt: 0.5,
            borderBottom: "2px solid #E2E8F0", // Solid continuous baseline across full width
            backgroundColor: "#FFFFFF",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              minHeight: 46,
              mb: "-2px", // Sit seamlessly on top of the 2px border
              "& .MuiTabs-indicator": {
                display: "none", // Disable MUI JavaScript indicator to prevent zoom offset misalignment
              },
              "& .MuiTab-root": {
                minHeight: 46,
                fontWeight: 600,
                fontSize: "0.82rem",
                textTransform: "none",
                fontFamily: "'Inter', sans-serif",
                color: COLORS.textSecondary,
                px: 2.5,
                borderBottom: "3px solid transparent",
                transition: "all 0.15s ease",
                "&.Mui-selected": {
                  color: COLORS.accent,
                  fontWeight: 800,
                  borderBottom: `3px solid ${COLORS.accent}`, // Pure CSS underline directly on active tab
                },
                "&:hover": {
                  color: COLORS.textPrimary,
                },
              },
            }}
          >
            <Tab
              icon={<FunnelIcon sx={{ fontSize: "18px !important" }} />}
              iconPosition="start"
              label={`17-Stage Funnel (${filteredStages.length})`}
            />
            <Tab
              icon={<HistoryIcon sx={{ fontSize: "18px !important" }} />}
              iconPosition="start"
              label={`Live Action & Remark Feed (${activity.length})`}
            />
            <Tab
              icon={<WarningIcon sx={{ fontSize: "18px !important" }} />}
              iconPosition="start"
              label={`SLA Escalations (${breaches.length})`}
            />
          </Tabs>
        </Box>

        {/* TAB 0: 17-STAGE FUNNEL (PROPER VERTICAL LIST: EK KE NICHE EK) */}
        {activeTab === 0 && (
          <Box sx={{ p: 2.5 }}>
            {/* Filter & Search Bar */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <TextField
                placeholder="Search stage name, number, or assigned desk..."
                size="small"
                value={stageSearch}
                onChange={(e) => setStageSearch(e.target.value)}
                sx={{
                  width: { xs: "100%", sm: 360 },
                  "& .MuiOutlinedInput-root": {
                    height: 36,
                    fontSize: "0.8125rem",
                    borderRadius: "8px",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: COLORS.textMuted }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Desk Filter Chips */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mr: 0.5 }}>
                  Filter Desk:
                </Typography>
                {["all", ...DESK_CONFIG.map((d) => d.role)].map((deskKey) => {
                  const isSel = selectedDesk.toLowerCase() === deskKey.toLowerCase();
                  return (
                    <Chip
                      key={deskKey}
                      label={deskKey === "all" ? "All Desks" : deskKey}
                      size="small"
                      onClick={() => setSelectedDesk(deskKey)}
                      sx={{
                        cursor: "pointer",
                        fontSize: "0.72rem",
                        fontWeight: isSel ? 700 : 500,
                        height: 26,
                        borderRadius: "8px",
                        backgroundColor: isSel ? COLORS.primarySoft : "#F1F5F9",
                        color: isSel ? COLORS.accent : COLORS.textSecondary,
                        border: `1px solid ${isSel ? "#BAE6FD" : "transparent"}`,
                        "&:hover": { backgroundColor: isSel ? COLORS.primarySoft : "#E2E8F0" },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Vertical List Table: Ek Ke Niche Ek */}
            <TableContainer
              sx={{
                borderRadius: "10px",
                border: `1px solid ${COLORS.border}`,
                overflowX: "auto",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4, width: 80 }}>
                      STAGE #
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                      STAGE NAME & LIFECYCLE DESCRIPTION
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4, width: 220 }}>
                      ASSIGNED OPERATIONAL DESK
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4, width: 150 }}>
                      PIPELINE STATUS
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4, width: 130, textAlign: "right" }}>
                      ACTIVE FILES
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4, width: 140, textAlign: "right" }}>
                      ACTION
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStages.map((st) => {
                    const count = Number(st.count) || 0;
                    const hasFiles = count > 0;
                    const deskMeta = DESK_CONFIG.find(
                      (d) => d.role.toLowerCase() === (st.assigned_role || "").toLowerCase()
                    ) || { color: COLORS.accent };

                    return (
                      <TableRow
                        key={st.stage_number}
                        hover
                        sx={{
                          backgroundColor: hasFiles ? "#F0F9FF" : "#FFFFFF",
                          "&:hover": {
                            backgroundColor: hasFiles ? "#E0F2FE !important" : "#F8FAFC !important",
                          },
                        }}
                      >
                        {/* Stage Number Avatar */}
                        <TableCell sx={{ py: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              bgcolor: hasFiles ? COLORS.accent : "#F1F5F9",
                              color: hasFiles ? "#FFFFFF" : COLORS.textSecondary,
                              borderRadius: "8px",
                            }}
                          >
                            {st.stage_number}
                          </Avatar>
                        </TableCell>

                        {/* Stage Name */}
                        <TableCell sx={{ py: 1.2 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                            {st.stage_name}
                          </Typography>
                          <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted, mt: 0.2 }}>
                            Sequential workflow step #{st.stage_number} in project lifecycle
                          </Typography>
                        </TableCell>

                        {/* Assigned Role */}
                        <TableCell sx={{ py: 1.2 }}>
                          <Chip
                            size="small"
                            label={st.assigned_role || "Back Office"}
                            sx={{
                              height: 24,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              backgroundColor: `${deskMeta.color}15`,
                              color: deskMeta.color,
                              borderRadius: "6px",
                            }}
                          />
                        </TableCell>

                        {/* Pipeline Status */}
                        <TableCell sx={{ py: 1.2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: hasFiles ? COLORS.success : "#CBD5E1",
                              }}
                            />
                            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: hasFiles ? COLORS.success : COLORS.textMuted }}>
                              {hasFiles ? "Files Active" : "Idle / Clear"}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Active Count */}
                        <TableCell sx={{ py: 1.2, textAlign: "right" }}>
                          <Chip
                            size="small"
                            label={`${count} File${count === 1 ? "" : "s"}`}
                            sx={{
                              height: 24,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              backgroundColor: hasFiles ? COLORS.accent : "#F1F5F9",
                              color: hasFiles ? "#FFFFFF" : COLORS.textMuted,
                              borderRadius: "6px",
                            }}
                          />
                        </TableCell>

                        {/* Action Link */}
                        <TableCell sx={{ py: 1.2, textAlign: "right" }}>
                          <Button
                            variant="outlined"
                            size="small"
                            endIcon={<OpenInNewIcon sx={{ fontSize: "14px !important" }} />}
                            onClick={() => navigate("/back-office")}
                            sx={{
                              height: 28,
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              textTransform: "none",
                              borderRadius: "6px",
                              borderColor: hasFiles ? COLORS.accent : COLORS.border,
                              color: hasFiles ? COLORS.accent : COLORS.textSecondary,
                              backgroundColor: "#FFFFFF",
                              "&:hover": {
                                backgroundColor: COLORS.primarySoft,
                                borderColor: COLORS.accent,
                              },
                            }}
                          >
                            Queue
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 1: LIVE ACTION & REMARK FEED */}
        {activeTab === 1 && (
          <Box sx={{ p: 2.5 }}>
            {/* Search & Filter Controls */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <TextField
                placeholder="Search file #, customer, operator, or remark text..."
                size="small"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                sx={{
                  width: { xs: "100%", sm: 360 },
                  "& .MuiOutlinedInput-root": {
                    height: 36,
                    fontSize: "0.8125rem",
                    borderRadius: "8px",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: COLORS.textMuted }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary }}>
                  Action Filter:
                </Typography>
                <Select
                  size="small"
                  value={activityActionFilter}
                  onChange={(e) => setActivityActionFilter(e.target.value)}
                  sx={{
                    height: 36,
                    fontSize: "0.8125rem",
                    minWidth: 140,
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="all">All Actions</MenuItem>
                  <MenuItem value="Submit">Submit / Forward</MenuItem>
                  <MenuItem value="Hold">Hold / Bottleneck</MenuItem>
                  <MenuItem value="Cancel">Cancel</MenuItem>
                  <MenuItem value="Clear">Clear / Verify</MenuItem>
                </Select>
              </Box>
            </Box>

            {/* Activity Log List */}
            {filteredActivity.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.85rem", color: COLORS.textMuted, fontWeight: 500 }}>
                  No recent audit activity matches your filter criteria.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {filteredActivity
                  .slice(
                    activityPage * activityRowsPerPage,
                    activityPage * activityRowsPerPage + activityRowsPerPage
                  )
                  .map((item) => {
                    const isHold = item.action_taken === "Hold";
                    const isCancel = item.action_taken === "Cancel";
                    const actionBg = isHold
                      ? COLORS.warningSoft
                      : isCancel
                      ? COLORS.dangerSoft
                      : COLORS.successSoft;
                    const actionColor = isHold
                      ? COLORS.warning
                      : isCancel
                      ? COLORS.danger
                      : COLORS.success;

                    return (
                      <Box
                        key={item.id}
                        sx={{
                          p: 1.8,
                          borderRadius: "10px",
                          backgroundColor: "#F8FAFC",
                          border: `1px solid ${COLORS.border}`,
                          borderLeft: `4px solid ${actionColor}`,
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.primary }}>
                              {item.file_number}
                            </Typography>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: COLORS.textPrimary }}>
                              • {item.customer_name}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                            {new Date(item.created_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                          <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                            <b>{item.performed_by_name || "Operator"}</b> ({item.performed_by_role || "Back Office"})
                          </Typography>
                          <Chip
                            size="small"
                            label={item.action_taken}
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              backgroundColor: actionBg,
                              color: actionColor,
                              borderRadius: "4px",
                            }}
                          />
                          <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                            on <b>Stage {item.stage_number}: {item.stage_name}</b>
                          </Typography>
                        </Box>

                        {item.remarks && (
                          <Typography
                            sx={{
                              mt: 0.8,
                              p: 1,
                              backgroundColor: "#FFFFFF",
                              borderRadius: "6px",
                              border: `1px solid ${COLORS.border}`,
                              fontStyle: "italic",
                              color: "#334155",
                              fontSize: "0.8rem",
                            }}
                          >
                            "{item.remarks}"
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
              </Stack>
            )}

            {/* Pagination for Activity Log */}
            {filteredActivity.length > activityRowsPerPage && (
              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <TablePagination
                  rowsPerPageOptions={[8, 16, 24]}
                  component="div"
                  count={filteredActivity.length}
                  rowsPerPage={activityRowsPerPage}
                  page={activityPage}
                  onPageChange={(_, newPage) => setActivityPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setActivityRowsPerPage(parseInt(e.target.value, 10));
                    setActivityPage(0);
                  }}
                  sx={{ border: "none", fontSize: "0.8125rem" }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* TAB 2: SLA ESCALATIONS TABLE */}
        {activeTab === 2 && (
          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <TextField
                placeholder="Search by file #, customer, stage, or desk..."
                size="small"
                value={breachSearch}
                onChange={(e) => setBreachSearch(e.target.value)}
                sx={{
                  width: { xs: "100%", sm: 340 },
                  "& .MuiOutlinedInput-root": {
                    height: 36,
                    fontSize: "0.8125rem",
                    borderRadius: "8px",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: COLORS.textMuted }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, fontWeight: 600 }}>
                Showing {filteredBreaches.length} SLA Breached File(s)
              </Typography>
            </Box>

            {filteredBreaches.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 38, color: COLORS.success, mb: 1 }} />
                <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: COLORS.primary }}>
                  All Active Files Within SLA Limits
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, mt: 0.3 }}>
                  No active project files have breached their turnaround deadlines.
                </Typography>
              </Box>
            ) : (
              <TableContainer
                sx={{
                  borderRadius: "8px",
                  border: `1px solid ${COLORS.border}`,
                  overflowX: "auto",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.2 }}>
                        FILE NUMBER
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.2 }}>
                        CUSTOMER NAME
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.2 }}>
                        CURRENT STAGE
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.2 }}>
                        ASSIGNED DESK
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.2 }}>
                        SLA DEADLINE
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.2, textAlign: "right" }}>
                        ACTION
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBreaches.map((b) => (
                      <TableRow key={b.id || b.file_number} hover>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.82rem", color: COLORS.primary }}>
                          {b.file_number}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.82rem", fontWeight: 600, color: COLORS.textPrimary }}>
                          {b.customer_name}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={`Stage ${b.current_stage}: ${b.stage_name}`}
                            sx={{
                              height: 22,
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              backgroundColor: COLORS.primarySoft,
                              color: COLORS.accent,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, fontWeight: 500 }}>
                          {b.assigned_role}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={
                              b.sla_deadline
                                ? new Date(b.sla_deadline).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Expired"
                            }
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              backgroundColor: COLORS.dangerSoft,
                              color: COLORS.danger,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <Button
                            variant="outlined"
                            size="small"
                            endIcon={<OpenInNewIcon sx={{ fontSize: "14px !important" }} />}
                            onClick={() => navigate("/back-office")}
                            sx={{
                              height: 30,
                              px: 1.5,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textTransform: "none",
                              borderRadius: "6px",
                              borderColor: COLORS.danger,
                              color: COLORS.danger,
                              whiteSpace: "nowrap",
                              minWidth: 140,
                              "&:hover": {
                                backgroundColor: COLORS.dangerSoft,
                                borderColor: COLORS.danger,
                              },
                            }}
                          >
                            Resolve in Queue
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
