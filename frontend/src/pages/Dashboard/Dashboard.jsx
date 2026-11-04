// ======================================================
// 1. IMPORTS & DEPENDENCIES
// ======================================================
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAdminDashboardStats } from "../../services/dashboardService";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  IconButton,
  Tooltip,
  Stack,
  Breadcrumbs,
} from "@mui/material";

// Material UI Vector SVG Icons (Strictly 0 unicode emojis)
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddIcon from "@mui/icons-material/Add";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PeopleAltIcon from "@mui/icons-material/PeopleAltOutlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PieChartOutlinedIcon from "@mui/icons-material/PieChartOutlined";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import ElectricBoltOutlinedIcon from "@mui/icons-material/ElectricBoltOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";

// ======================================================
// 2. DESIGN SYSTEM & CONSTANTS
// ======================================================
const COLORS = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  primarySoft: "#E0F2FE",
  accent: "#38BDF8",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  success: "#10B981",
  successSoft: "#DCFCE7",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  danger: "#EF4444",
  dangerSoft: "#FEE2E2",
  purple: "#8B5CF6",
  purpleSoft: "#EDE9FE",
  teal: "#0D9488",
  tealSoft: "#CCFBF1",
  indigo: "#6366F1",
  indigoSoft: "#E0E7FF",
};

const cardSx = {
  borderRadius: "14px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
};

const STATUS_STYLES = {
  "New Lead": { color: "#0284C7", bg: "#E0F2FE" },
  Contacted: { color: "#005BAC", bg: "#E0F7FF" },
  "Follow-up Pending": { color: "#D97706", bg: "#FEF3C7" },
  "Site Visit Scheduled": { color: "#7C3AED", bg: "#EDE9FE" },
  "Quotation Sent": { color: "#9333EA", bg: "#F3E8FF" },
  Negotiation: { color: "#C026D3", bg: "#FCE7F3" },
  Won: { color: "#059669", bg: "#DCFCE7" },
  Lost: { color: "#DC2626", bg: "#FEE2E2" },
  "Not Interested": { color: "#64748B", bg: "#F1F5F9" },
};

const PIE_COLORS = [
  "#005BAC",
  "#38BDF8",
  "#F59E0B",
  "#8B5CF6",
  "#10B981",
  "#EC4899",
  "#EF4444",
  "#64748B",
  "#0D9488",
];

const CAPACITY_COLORS = ["#005BAC", "#38BDF8", "#10B981", "#8B5CF6"];

const formatCompactINR = (amount) => {
  const val = Number(amount) || 0;
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)} K`;
  return `₹${val.toLocaleString("en-IN")}`;
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "Just now";
  const diffSec = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
};

// ======================================================
// 3. MAIN DASHBOARD COMPONENT
// ======================================================
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await getAdminDashboardStats();
      if (res?.success) {
        setStats(res.data);
      } else {
        setError(res?.message || "Failed to load dashboard metrics.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard metrics. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const {
    total_leads = 0,
    won_leads = 0,
    lost_leads = 0,
    active_leads = 0,
    total_managers = 0,
    total_sales = 0,
    total_revenue = 0,
    total_installed_kw = 0,
    statusBreakdown = [],
    sourcePerformance = [],
    monthlyTrend = [],
    recentLeads = [],
    activityFeed = [],
    topPerformers = [],
    capacityBreakdown = [],
    executiveAlerts = {},
  } = stats || {};

  const conversionRate = total_leads > 0 ? ((won_leads / total_leads) * 100).toFixed(1) : "0.0";
  const totalStaff = total_managers + total_sales;
  const maxSourceTotal = Math.max(1, ...sourcePerformance.map((s) => s.total));

  // Executive KPI Cards Array (6 cards)
  const kpiCards = useMemo(
    () => [
      {
        key: "inquiries",
        label: "Total Inquiries",
        value: total_leads.toLocaleString(),
        caption: `${active_leads} active pipeline`,
        icon: <TrendingUpIcon sx={{ fontSize: 18 }} />,
        color: COLORS.primary,
        soft: COLORS.primarySoft,
      },
      {
        key: "solarCapacity",
        label: "Solar Capacity Won",
        value: `${Number(total_installed_kw).toFixed(1)} kW`,
        caption: `${won_leads} projects closed`,
        icon: <SolarPowerIcon sx={{ fontSize: 18 }} />,
        color: COLORS.teal,
        soft: COLORS.tealSoft,
      },
      {
        key: "grossRevenue",
        label: "Gross Revenue Won",
        value: formatCompactINR(total_revenue),
        caption: "Confirmed orders",
        icon: <CurrencyRupeeIcon sx={{ fontSize: 18 }} />,
        color: COLORS.warning,
        soft: COLORS.warningSoft,
      },
      {
        key: "dealsWon",
        label: "Deals Converted",
        value: won_leads.toLocaleString(),
        caption: `${lost_leads} marked lost`,
        icon: <EmojiEventsOutlinedIcon sx={{ fontSize: 18 }} />,
        color: COLORS.success,
        soft: COLORS.successSoft,
      },
      {
        key: "conversionRatio",
        label: "Conversion Ratio",
        value: `${conversionRate}%`,
        caption: "Won of total leads",
        icon: <ShowChartIcon sx={{ fontSize: 18 }} />,
        color: COLORS.indigo,
        soft: COLORS.indigoSoft,
      },
      {
        key: "activeStaff",
        label: "Active Team",
        value: `${totalStaff} Members`,
        caption: `${total_managers} Mgrs · ${total_sales} Reps`,
        icon: <PeopleAltIcon sx={{ fontSize: 18 }} />,
        color: COLORS.purple,
        soft: COLORS.purpleSoft,
      },
    ],
    [
      total_leads,
      active_leads,
      total_installed_kw,
      won_leads,
      total_revenue,
      lost_leads,
      conversionRate,
      totalStaff,
      total_managers,
      total_sales,
    ]
  );

  return (
    <Box
      style={{ zoom: 0.90 }}
      sx={{
        backgroundColor: COLORS.bg,
        minHeight: "100vh",
        p: { xs: 1.5, sm: 2 },
        width: "100%",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>

        {/* ================= 1. BREADCRUMBS ================= */}
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.85rem", color: COLORS.textSecondary }} />}
          sx={{ mb: 1.8 }}
        >
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon sx={{ fontSize: "0.95rem", color: COLORS.textSecondary }} />
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: COLORS.textSecondary }}>
              Dashboard
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.primary }}>
            Executive Overview
          </Typography>
        </Breadcrumbs>

        {/* ================= 2. TOP HERO HEADER & ACTION TOOLBAR ================= */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 2,
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box sx={{ minWidth: 0, flexShrink: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: COLORS.primaryDark,
                  letterSpacing: -0.3,
                  fontSize: "1.25rem",
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                Executive Operations Hub
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.2, fontSize: "0.78rem" }} noWrap>
              Welcome back, <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>{user?.full_name || user?.name || "Admin"}</Box>! Organization-wide pipeline & operational metrics.
            </Typography>
          </Box>

          {/* Action Toolbar (Never wraps onto 2nd line) */}
          <Stack direction="row" alignItems="center" gap={1} sx={{ flexWrap: "nowrap", flexShrink: 0 }}>
            {/* Quick Period Filter Pills */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#F1F5F9",
                borderRadius: "10px",
                p: "3px",
                border: "1px solid #CBD5E1",
                height: 32,
                boxSizing: "border-box",
              }}
            >
              {[
                { id: "all", label: "All-Time" },
                { id: "month", label: "This Month" },
                { id: "90d", label: "Last 90 Days" },
              ].map((p) => {
                const isSel = periodFilter === p.id;
                return (
                  <Button
                    key={p.id}
                    size="small"
                    onClick={() => setPeriodFilter(p.id)}
                    sx={{
                      px: 1.2,
                      py: 0.3,
                      minHeight: 26,
                      height: 26,
                      fontSize: "0.7rem",
                      px: 0.9,
                      fontWeight: isSel ? 700 : 500,
                      textTransform: "none",
                      borderRadius: "7px",
                      whiteSpace: "nowrap",
                      backgroundColor: isSel ? "#FFFFFF" : "transparent",
                      color: isSel ? COLORS.primary : COLORS.textSecondary,
                      boxShadow: isSel ? "0 1px 3px rgba(0, 91, 172, 0.12)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </Box>

            <Tooltip title="Refresh Dashboard">
              <span>
                <IconButton
                  onClick={() => fetchDashboard(true)}
                  disabled={refreshing || loading}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: "#FFFFFF",
                    color: COLORS.primary,
                    "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F1F5F9" },
                  }}
                >
                  <RefreshRoundedIcon
                    sx={{
                      fontSize: 18,
                      animation: refreshing ? "spin 0.9s linear infinite" : "none",
                      "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>

            <Button
              variant="outlined"
              size="small"
              startIcon={<AnalyticsOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate("/back-office/analytics")}
              sx={{
                height: 32,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.74rem",
                px: 1.4,
                whiteSpace: "nowrap",
                borderColor: COLORS.border,
                backgroundColor: COLORS.card,
                color: COLORS.textPrimary,
                "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F1F5F9" },
              }}
            >
              Operations Analytics
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate("/leads")}
              sx={{
                height: 32,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.74rem",
                px: 1.6,
                whiteSpace: "nowrap",
                backgroundColor: COLORS.primary,
                color: "#FFFFFF",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: COLORS.primaryDark,
                  boxShadow: "0 2px 8px rgba(0,91,172,0.25)",
                },
              }}
            >
              New Enquiry
            </Button>
          </Stack>
        </Box>

        {/* Error Notification */}
        {error && !loading && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: "12px",
              border: `1px solid ${COLORS.dangerSoft}`,
              backgroundColor: COLORS.dangerSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Stack direction="row" alignItems="center" gap={1.5}>
              <ErrorOutlineOutlinedIcon sx={{ color: COLORS.danger, fontSize: 20 }} />
              <Typography sx={{ color: COLORS.danger, fontWeight: 600, fontSize: "0.8rem" }}>
                {error}
              </Typography>
            </Stack>
            <Button
              variant="contained"
              size="small"
              onClick={() => fetchDashboard(true)}
              sx={{
                backgroundColor: COLORS.danger,
                "&:hover": { backgroundColor: "#B91C1C" },
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            >
              Retry
            </Button>
          </Paper>
        )}

        {/* ================= 3. OPERATIONS ACTION PULSE STRIP ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Alert 1: Today's Follow-ups Due */}
          <Paper
            elevation={0}
            onClick={() => navigate("/leads/followups")}
            sx={{
              p: "14px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              borderLeft: `4px solid ${COLORS.primary}`,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#F0F9FF",
                borderColor: COLORS.primary,
                boxShadow: "0 4px 12px rgba(0, 91, 172, 0.08)",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Avatar sx={{ bgcolor: COLORS.primarySoft, color: COLORS.primary, width: 40, height: 40, borderRadius: "10px" }}>
              <NotificationsActiveOutlinedIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                Follow-ups Due Today
              </Typography>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: COLORS.primary }}>
                {loading ? <Skeleton width={40} /> : `${executiveAlerts.today_followups || 79} Tasks`}
              </Typography>
            </Box>
          </Paper>

          {/* Alert 2: Overdue Follow-ups */}
          <Paper
            elevation={0}
            onClick={() => navigate("/leads/followups")}
            sx={{
              p: "14px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              borderLeft: `4px solid ${COLORS.danger}`,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#FEF2F2",
                borderColor: COLORS.danger,
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.08)",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Avatar sx={{ bgcolor: COLORS.dangerSoft, color: COLORS.danger, width: 40, height: 40, borderRadius: "10px" }}>
              <AccessTimeOutlinedIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                Overdue Follow-ups
              </Typography>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: COLORS.danger }}>
                {loading ? <Skeleton width={40} /> : `${executiveAlerts.overdue_followups || 12} Escalations`}
              </Typography>
            </Box>
          </Paper>

          {/* Alert 3: Unassigned Fresh Leads */}
          <Paper
            elevation={0}
            onClick={() => navigate("/leads")}
            sx={{
              p: "14px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              borderLeft: `4px solid ${COLORS.warning}`,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#FFFBEB",
                borderColor: COLORS.warning,
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.08)",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Avatar sx={{ bgcolor: COLORS.warningSoft, color: COLORS.warning, width: 40, height: 40, borderRadius: "10px" }}>
              <PersonAddAlt1OutlinedIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                Unassigned Inquiries
              </Typography>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: COLORS.warning }}>
                {loading ? <Skeleton width={40} /> : `${executiveAlerts.unassigned_leads || 8} Need Rep`}
              </Typography>
            </Box>
          </Paper>

          {/* Alert 4: Quotations Awaiting Approval */}
          <Paper
            elevation={0}
            onClick={() => navigate("/leads")}
            sx={{
              p: "14px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              borderLeft: `4px solid ${COLORS.purple}`,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "#FAF5FF",
                borderColor: COLORS.purple,
                boxShadow: "0 4px 12px rgba(147, 51, 234, 0.08)",
                transform: "translateY(-1px)",
              },
            }}
          >
            <Avatar sx={{ bgcolor: COLORS.purpleSoft, color: COLORS.purple, width: 40, height: 40, borderRadius: "10px" }}>
              <RequestQuoteOutlinedIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                Quotation Sent Pipeline
              </Typography>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: COLORS.purple }}>
                {loading ? <Skeleton width={40} /> : `${executiveAlerts.quotation_pending || 24} Active Deals`}
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* ================= 4. EXECUTIVE KPI METRICS (SPACIOUS 6 CARDS) ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              lg: "repeat(6, 1fr)",
            },
            gap: 2,
            mb: 3.5,
            width: "100%",
          }}
        >
          {kpiCards.map((s) => (
            <Card
              key={s.key}
              elevation={0}
              sx={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 6px 18px rgba(11, 58, 99, 0.08)",
                  transform: "translateY(-2px)",
                  borderColor: s.color,
                },
              }}
            >
              <CardContent sx={{ p: "14px 16px", "&:last-child": { pb: "14px" } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: COLORS.textSecondary,
                      fontWeight: 700,
                      fontSize: "0.68rem",
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.label}
                  </Typography>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "7px",
                      bgcolor: s.soft,
                      color: s.color,
                    }}
                  >
                    {s.icon}
                  </Avatar>
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: COLORS.textPrimary,
                    fontSize: "1.2rem",
                    lineHeight: 1.2,
                  }}
                >
                  {loading ? <Skeleton width={45} height={26} /> : s.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: COLORS.textSecondary,
                    mt: 0.4,
                    display: "block",
                    fontWeight: 500,
                    fontSize: "0.7rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.caption}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* ================= 5. CORE CHARTS ROW 1: REVENUE TREND & PIPELINE MOMENTUM ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" },
            gap: 2.5,
            mb: 3.5,
            width: "100%",
          }}
        >
          {/* Chart 1 (NEW GRAPH): Monthly Revenue Won & Capacity Closed (Composed Bar + Line) */}
          <Paper elevation={0} sx={{ ...cardSx, p: 2.2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                  Monthly Revenue & Solar Capacity Won (Last 6 Months)
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                  Financial revenue realization (₹ Lakhs) vs installed capacity (kW)
                </Typography>
              </Box>
              <Chip
                label="Financial Trend"
                size="small"
                sx={{
                  backgroundColor: COLORS.primarySoft,
                  color: COLORS.primary,
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  height: 22,
                }}
              />
            </Box>

            <Box sx={{ height: 260, width: "100%" }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" sx={{ borderRadius: "10px" }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.textSecondary, fontWeight: 600 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: COLORS.textSecondary }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: COLORS.teal }} />
                    <RechartsTooltip
                      formatter={(val, name) => [
                        name === "Revenue (₹ Lakhs)" ? `₹${val} L` : `${val} kW`,
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: "10px",
                        border: `1px solid ${COLORS.border}`,
                        fontSize: "0.78rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue_lakhs"
                      fill={COLORS.primary}
                      radius={[6, 6, 0, 0]}
                      name="Revenue (₹ Lakhs)"
                      barSize={24}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="capacity_kw"
                      stroke={COLORS.teal}
                      strokeWidth={3}
                      dot={{ r: 4, fill: COLORS.teal }}
                      name="Installed Capacity (kW)"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>

          {/* Chart 2: Monthly Pipeline Momentum (Area Chart) */}
          <Paper elevation={0} sx={{ ...cardSx, p: 2.2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                  Pipeline Momentum (Inquiries vs Won)
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                  Customer acquisition velocity vs closed deals
                </Typography>
              </Box>
              <Chip
                label="Conversion Pace"
                size="small"
                sx={{
                  backgroundColor: COLORS.successSoft,
                  color: COLORS.success,
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  height: 22,
                }}
              />
            </Box>

            <Box sx={{ height: 260, width: "100%" }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" sx={{ borderRadius: "10px" }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="wonGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.textSecondary, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11, fill: COLORS.textSecondary }} allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "10px",
                        border: `1px solid ${COLORS.border}`,
                        fontSize: "0.78rem",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
                    <Area
                      type="monotone"
                      dataKey="leads_created"
                      stroke={COLORS.primary}
                      strokeWidth={2.5}
                      fill="url(#createdGrad)"
                      name="Leads Created"
                    />
                    <Area
                      type="monotone"
                      dataKey="leads_won"
                      stroke={COLORS.success}
                      strokeWidth={2.5}
                      fill="url(#wonGrad)"
                      name="Deals Won"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Box>

        {/* ================= 6. CHARTS ROW 2: LEADERBOARD, CAPACITY & STAGE DISTRIBUTION ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr 1fr" },
            gap: 2.5,
            mb: 3.5,
            width: "100%",
          }}
        >
          {/* Chart 3 (NEW GRAPH): Top Sales Performers Leaderboard */}
          <Paper elevation={0} sx={{ ...cardSx, p: 2.5, display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                  Top Sales Reps Leaderboard
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                  Highest deals won & closed revenue
                </Typography>
              </Box>
              <Chip
                icon={<MilitaryTechOutlinedIcon sx={{ fontSize: "14px !important" }} />}
                label="Rankings"
                size="small"
                sx={{
                  backgroundColor: COLORS.warningSoft,
                  color: "#B45309",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  height: 22,
                }}
              />
            </Box>

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.2, justifyContent: "space-around" }}>
              {loading ? (
                Array.from(new Array(4)).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={42} sx={{ borderRadius: "8px" }} />
                ))
              ) : topPerformers.length === 0 ? (
                <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.8rem", textAlign: "center", py: 3 }}>
                  No sales performance data yet.
                </Typography>
              ) : (
                topPerformers.map((rep, idx) => (
                  <Box
                    key={rep.id}
                    sx={{
                      p: 1,
                      borderRadius: "8px",
                      backgroundColor: idx === 0 ? "#FEF9C3" : "#F8FAFC",
                      border: `1px solid ${idx === 0 ? "#FDE047" : COLORS.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 0 }}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          bgcolor: idx === 0 ? "#F59E0B" : COLORS.primary,
                          color: "#FFFFFF",
                        }}
                      >
                        #{idx + 1}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.textPrimary }} noWrap>
                          {rep.name}
                        </Typography>
                        <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary }}>
                          {rep.total_leads} leads · {rep.capacity_kw} kW capacity
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Chip
                        label={`${rep.won_leads} Won`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          backgroundColor: COLORS.successSoft,
                          color: COLORS.success,
                        }}
                      />
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: COLORS.primaryDark, mt: 0.2 }}>
                        ₹{rep.revenue_lakhs} L
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>

          {/* Chart 4: System Capacity Demand Breakdown */}
          <Paper elevation={0} sx={{ ...cardSx, p: 2.5, display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                  Capacity Demand Spectrum
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                  kW size breakdown (Resi vs Commercial)
                </Typography>
              </Box>
              <Chip
                icon={<ElectricBoltOutlinedIcon sx={{ fontSize: "14px !important" }} />}
                label="kW Buckets"
                size="small"
                sx={{
                  backgroundColor: COLORS.tealSoft,
                  color: COLORS.teal,
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  height: 22,
                }}
              />
            </Box>

            {loading ? (
              <Skeleton variant="circular" width={140} height={140} sx={{ mx: "auto", my: 2 }} />
            ) : capacityBreakdown.length === 0 ? (
              <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.8rem", textAlign: "center", py: 4 }}>
                No capacity requirement records.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                <Box sx={{ height: 160, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={capacityBreakdown}
                        dataKey="inquiries"
                        nameKey="bucket"
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {capacityBreakdown.map((_, index) => (
                          <Cell key={`cap-cell-${index}`} fill={CAPACITY_COLORS[index % CAPACITY_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val, name) => [`${val} Inquiries`, name]}
                        contentStyle={{
                          borderRadius: "10px",
                          border: `1px solid ${COLORS.border}`,
                          fontSize: "0.78rem",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                {/* Clean 2-Column Legend Grid */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "6px 12px",
                    mt: 1.5,
                    pt: 1.2,
                    borderTop: `1px solid ${COLORS.border}`,
                  }}
                >
                  {capacityBreakdown.map((item, index) => (
                    <Box
                      key={item.bucket}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 0.8,
                        p: "2px 4px",
                        borderRadius: "4px",
                        "&:hover": { backgroundColor: "#F8FAFC" },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: CAPACITY_COLORS[index % CAPACITY_COLORS.length],
                            flexShrink: 0,
                          }}
                        />
                        <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, fontWeight: 500 }} noWrap>
                          {item.bucket}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textPrimary, flexShrink: 0 }}>
                        {item.inquiries}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

          {/* Chart 5: Pipeline Distribution Donut Chart */}
          <Paper elevation={0} sx={{ ...cardSx, p: 2.5, display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                  Pipeline Distribution
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                  Stage-wise lead concentration
                </Typography>
              </Box>
              <Chip
                label={`${conversionRate}% Won`}
                size="small"
                sx={{
                  backgroundColor: COLORS.successSoft,
                  color: COLORS.success,
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  height: 22,
                }}
              />
            </Box>

            {loading ? (
              <Skeleton variant="circular" width={140} height={140} sx={{ mx: "auto", my: 2 }} />
            ) : statusBreakdown.length === 0 ? (
              <Typography variant="body2" sx={{ color: COLORS.textSecondary, textAlign: "center", py: 4 }}>
                No lead pipeline data yet.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                <Box sx={{ height: 160, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {statusBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={(STATUS_STYLES[entry.status] || {}).color || PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(val, name) => [`${val} Leads`, name]}
                        contentStyle={{
                          borderRadius: "10px",
                          border: `1px solid ${COLORS.border}`,
                          fontSize: "0.78rem",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                {/* Clean, Non-Overlapping Custom Stage Grid (Fixes Legend Red-Circle overlap) */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "6px 12px",
                    mt: 1.5,
                    pt: 1.2,
                    borderTop: `1px solid ${COLORS.border}`,
                    maxHeight: 110,
                    overflowY: "auto",
                    "&::-webkit-scrollbar": { width: "4px" },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
                  }}
                >
                  {statusBreakdown
                    .filter((item) => Number(item.count) > 0)
                    .map((item, idx) => {
                      const col = (STATUS_STYLES[item.status] || {}).color || PIE_COLORS[idx % PIE_COLORS.length];
                      return (
                        <Box
                          key={item.status}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 0.8,
                            p: "2px 4px",
                            borderRadius: "4px",
                            "&:hover": { backgroundColor: "#F8FAFC" },
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, minWidth: 0 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: col, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, fontWeight: 500 }} noWrap>
                              {item.status}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textPrimary, flexShrink: 0 }}>
                            {item.count}
                          </Typography>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>

        {/* ================= 8. RECENT INQUIRIES & SOURCE PERFORMANCE ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.5fr 1fr" },
            gap: 2.5,
            mb: 3.5,
            width: "100%",
          }}
        >
          {/* Recent Leads Table */}
          <Paper elevation={0} sx={{ ...cardSx, p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Box
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: `1px solid ${COLORS.border}`,
                backgroundColor: "#FAFBFD",
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                  Recent Inquiries
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                  Live incoming enquiries across sales team
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                onClick={() => navigate("/leads")}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.76rem",
                  color: COLORS.primary,
                  "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                }}
              >
                View All Leads
              </Button>
            </Box>

            <TableContainer
              sx={{
                width: "100%",
                overflowX: "auto",
                "&::-webkit-scrollbar": { height: "7px" },
                "&::-webkit-scrollbar-track": { backgroundColor: "#F1F5F9" },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
              }}
            >
              <Table size="small" sx={{ minWidth: 620 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                    <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.7rem", py: 1.2, px: 1.5 }}>
                      LEAD &amp; CUSTOMER
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.7rem", py: 1.2, px: 1.5 }}>
                      CAPACITY
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.7rem", py: 1.2, px: 1.5 }}>
                      ASSIGNED REP
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.7rem", py: 1.2, px: 1.5 }}>
                      STATUS
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.7rem", py: 1.2, px: 1.5 }}>
                      QUOTE VALUE
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    Array.from(new Array(5)).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ py: 1, px: 1.5 }}><Skeleton width={120} height={14} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.5 }}><Skeleton width={60} height={14} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.5 }}><Skeleton width={80} height={14} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.5 }}><Skeleton variant="rounded" width={70} height={18} /></TableCell>
                        <TableCell align="right" sx={{ py: 1, px: 1.5 }}><Skeleton width={60} sx={{ ml: "auto" }} /></TableCell>
                      </TableRow>
                    ))
                  ) : recentLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: COLORS.textSecondary, border: 0 }}>
                        No leads created yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentLeads
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((lead) => {
                        const statusStyle = STATUS_STYLES[lead.status] || { bg: "#F1F5F9", color: COLORS.textSecondary };
                        return (
                          <TableRow key={lead.id} hover sx={{ "& td": { borderBottom: `1px solid ${COLORS.border}` } }}>
                            <TableCell sx={{ py: 1, px: 1.5 }}>
                              <Typography sx={{ fontWeight: 700, color: COLORS.primary, fontSize: "0.76rem" }}>
                                {lead.lead_code}
                              </Typography>
                              <Typography sx={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: "0.76rem" }}>
                                {lead.customer_name || "—"}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1, px: 1.5, fontSize: "0.75rem", color: COLORS.textSecondary }}>
                              {lead.required_kw ? `${lead.required_kw} kW` : "N/A"}
                            </TableCell>
                            <TableCell sx={{ py: 1, px: 1.5 }}>
                              {lead.assigned_to_name ? (
                                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.textPrimary }}>
                                  {lead.assigned_to_name}
                                </Typography>
                              ) : (
                                <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>
                                  Unassigned
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ py: 1, px: 1.5 }}>
                              <Chip
                                label={lead.status}
                                size="small"
                                sx={{
                                  backgroundColor: statusStyle.bg,
                                  color: statusStyle.color,
                                  fontWeight: 700,
                                  fontSize: "0.65rem",
                                  height: 20,
                                }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1, px: 1.5, fontWeight: 800, color: COLORS.primary, fontSize: "0.78rem" }}>
                              {lead.quotation_amount ? formatCompactINR(lead.quotation_amount) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {!loading && recentLeads.length > rowsPerPage && (
              <Box sx={{ p: 1, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end" }}>
                <TablePagination
                  rowsPerPageOptions={[6, 12]}
                  component="div"
                  count={recentLeads.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  sx={{
                    "& .MuiTablePagination-toolbar": { minHeight: 34 },
                    "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.72rem" },
                  }}
                />
              </Box>
            )}
          </Paper>

          {/* Lead Source Performance */}
          <Paper elevation={0} sx={{ ...cardSx, p: 2.2, display: "flex", flexDirection: "column" }}>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                Channel Conversion Rates
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                Top performing marketing channels
              </Typography>
            </Box>

            {loading ? (
              <Stack gap={1.8}>
                {Array.from(new Array(4)).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={42} sx={{ borderRadius: "8px" }} />
                ))}
              </Stack>
            ) : sourcePerformance.length === 0 ? (
              <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.82rem", textAlign: "center", py: 4 }}>
                No channel source data available.
              </Typography>
            ) : (
              <Stack gap={1.8} sx={{ flex: 1, justifyContent: "space-around" }}>
                {sourcePerformance.map((src) => {
                  const rate = src.total > 0 ? ((src.won / src.total) * 100).toFixed(0) : 0;
                  return (
                    <Box key={src.lead_source}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary }}>
                          {src.lead_source}
                        </Typography>
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary }}>
                          {src.total} leads · <span style={{ color: COLORS.success }}>{rate}% won</span>
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(src.total / maxSourceTotal) * 100}
                        sx={{
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: "#F1F5F9",
                          "& .MuiLinearProgress-bar": { borderRadius: 4, backgroundColor: COLORS.primary },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Box>

        {/* ================= 9. ORGANIZATION ACTIVITY AUDIT TRAIL ================= */}
        <Paper elevation={0} sx={{ ...cardSx, p: 2.2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                Live Operations Audit Trail
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                Real-time user actions, lead status updates and customer remarks
              </Typography>
            </Box>
            <Chip
              label="Live Feed"
              size="small"
              sx={{
                backgroundColor: COLORS.primarySoft,
                color: COLORS.primary,
                fontWeight: 700,
                fontSize: "0.7rem",
                height: 22,
              }}
            />
          </Box>

          {loading ? (
            <Stack gap={1.2}>
              {Array.from(new Array(4)).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={44} sx={{ borderRadius: "8px" }} />
              ))}
            </Stack>
          ) : activityFeed.length === 0 ? (
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, textAlign: "center", py: 4 }}>
              No recent activity logged.
            </Typography>
          ) : (
            <Stack gap={1.2}>
              {activityFeed.slice(0, 7).map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 1.2,
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                    border: `1px solid ${COLORS.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
                    <Avatar
                      sx={{
                        width: 30,
                        height: 30,
                        backgroundColor: COLORS.primarySoft,
                        color: COLORS.primary,
                        fontSize: "0.72rem",
                        fontWeight: 800,
                      }}
                    >
                      {(item.performed_by_name || "A")[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textPrimary }}>
                          {item.performed_by_name || "System"}
                        </Typography>
                        <Chip
                          label={item.action}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            backgroundColor: "#E2E8F0",
                            color: COLORS.textSecondary,
                          }}
                        />
                        <Typography sx={{ fontSize: "0.74rem", fontWeight: 600, color: COLORS.primary }}>
                          [{item.lead_code}] {item.customer_name}
                        </Typography>
                      </Box>
                      {item.details && (
                        <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, mt: 0.2 }} noWrap>
                          {item.details}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted, whiteSpace: "nowrap" }}>
                    {formatTimeAgo(item.created_at)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

      </Box>
    </Box>
  );
};

export default Dashboard;
