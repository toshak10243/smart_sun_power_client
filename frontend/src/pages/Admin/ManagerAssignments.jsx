import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert as MuiAlert,
  Breadcrumbs,
  LinearProgress,
} from "@mui/material";

import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  AssignmentInd as AssignmentIndIcon,
  Visibility as ViewIcon,
  Call as CallIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  HomeOutlined as HomeOutlinedIcon,
  NavigateNextRounded as NavigateNextRoundedIcon,
  Group as GroupIcon,
  SolarPower as SolarPowerIcon,
  EmojiEvents as WonIcon,
  Timeline as TimelineIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  ArrowForwardRounded as ArrowForwardIcon,
  FilterListOff as FilterListOffIcon,
  ViewAgendaOutlined as ViewAgendaOutlinedIcon,
  TableRowsOutlined as TableRowsOutlinedIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

import {
  getManagerAssignmentsSummary,
  getManagerAssignedLeads,
} from "../../services/userServices";
import { getLeadById } from "../../services/leadService";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

/* ============================================================
   DESIGN TOKENS — Matches All Leads & Todays Followup
   ============================================================ */
const COLORS = {
  primary: "#0B3A63",
  primaryHover: "#082F52",
  primaryDark: "#0B3A63",
  accent: "#005BAC",
  sky: "#38BDF8",
  primarySoft: "#E0F2FE",
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

const STATUS_OPTIONS = [
  "New Lead",
  "Contacted",
  "Follow-up Pending",
  "Site Visit Scheduled",
  "Quotation Sent",
  "Negotiation",
  "Won",
  "Lost",
  "Not Interested",
];

const STATUS_STYLES = {
  "New Lead": { color: "#0284C7", bg: "#E0F2FE", border: "#BAE6FD" },
  Contacted: { color: "#005BAC", bg: "#E0F7FF", border: "#BAE6FD" },
  "Follow-up Pending": { color: COLORS.warning, bg: COLORS.warningSoft, border: "#FDE68A" },
  "Site Visit Scheduled": { color: COLORS.purple, bg: COLORS.purpleSoft, border: "#DDD6FE" },
  "Quotation Sent": { color: "#9333EA", bg: "#F3E8FF", border: "#E9D5FF" },
  Negotiation: { color: "#C026D3", bg: "#FCE7F3", border: "#FBCFE8" },
  Won: { color: COLORS.success, bg: COLORS.successSoft, border: "#BBF7D0" },
  Lost: { color: COLORS.danger, bg: COLORS.dangerSoft, border: "#FECACA" },
  "Not Interested": { color: COLORS.textSecondary, bg: "#F1F5F9", border: "#E2E8F0" },
};

const cardSx = {
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
};

const controlSx = {
  fontFamily: "'Inter', sans-serif",
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    fontSize: "0.8125rem",
    color: COLORS.textPrimary,
    minHeight: 38,
    height: 38,
    "& fieldset": { borderColor: COLORS.border, borderWidth: "1px" },
    "&:hover fieldset": { borderColor: COLORS.accent },
    "&.Mui-focused fieldset": { borderColor: COLORS.accent, borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.8125rem",
    py: "7px !important",
  },
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "M";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const resolveAvatar = (imgPath) => {
  if (!imgPath || imgPath === "null" || imgPath === "undefined" || imgPath.trim() === "") return null;
  if (imgPath.startsWith("http")) return imgPath;
  let clean = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;
  if (!clean.startsWith("uploads/profiles/")) {
    if (clean.startsWith("uploads/")) clean = clean.replace("uploads/", "uploads/profiles/");
    else clean = `uploads/profiles/${clean}`;
  }
  return `${API_BASE_URL}/${clean}`;
};

const formatDate = (val) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return val;
  }
};

const StatusChip = ({ status }) => {
  const style = STATUS_STYLES[status] || { color: COLORS.textMuted, bg: "#F1F2F4", border: "#E2E8F0" };
  return (
    <Chip
      label={status || "—"}
      size="small"
      sx={{
        color: style.color,
        backgroundColor: style.bg,
        border: `1px solid ${style.border || "transparent"}`,
        fontWeight: 600,
        fontSize: "0.6875rem",
        height: 22,
        borderRadius: "6px",
        fontFamily: "'Inter', sans-serif",
      }}
    />
  );
};

const FieldLabel = ({ children }) => (
  <Typography
    variant="caption"
    sx={{
      display: "block",
      mb: 0.5,
      fontWeight: 600,
      fontSize: "0.72rem",
      color: COLORS.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      fontFamily: "'Inter', sans-serif",
    }}
  >
    {children}
  </Typography>
);

/* ============================================================
   KPI CARD — Clean & Modern
   ============================================================ */
const KpiCard = ({ icon, label, value, accent, subtext, loading }) => (
  <Card
    elevation={0}
    sx={{
      flex: "1 1 180px",
      minWidth: "160px",
      borderRadius: "12px",
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.card,
      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
        transform: "translateY(-2px)",
        borderColor: COLORS.borderStrong,
      },
    }}
  >
    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: COLORS.textSecondary,
            fontWeight: 700,
            fontSize: "0.7rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {label}
        </Typography>
        <Avatar
          sx={{
            width: 34,
            height: 34,
            borderRadius: "10px",
            bgcolor: `${accent}15`,
            color: accent,
          }}
        >
          {icon}
        </Avatar>
      </Box>
      {loading ? (
        <Skeleton width={60} height={32} />
      ) : (
        <>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: COLORS.textPrimary,
              fontSize: "1.45rem",
              lineHeight: 1.2,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {value}
          </Typography>
          {subtext && (
            <Typography variant="caption" sx={{ color: COLORS.textMuted, fontSize: "0.72rem", mt: 0.4, display: "block", fontFamily: "'Inter', sans-serif" }}>
              {subtext}
            </Typography>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

function ManagerAssignments() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all"); // 'all' | 'with_leads' | 'with_won' | 'zero_leads'
  const [viewMode, setViewMode] = useState("table"); // 'box' | 'table'
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Detail Drawer State
  const [selectedManager, setSelectedManager] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [managerLeads, setManagerLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("");

  // Single Lead Detail Modal
  const [viewLeadId, setViewLeadId] = useState(null);
  const [leadDetails, setLeadDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Pagination for Master
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Pagination for Drawer Leads
  const [drawerPage, setDrawerPage] = useState(0);
  const [drawerRowsPerPage, setDrawerRowsPerPage] = useState(10);

  const showToast = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchManagersSummaryData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getManagerAssignmentsSummary();
      if (res?.success) {
        setManagers(res.data || []);
      } else {
        showToast(res?.message || "Failed to fetch managers.", "error");
      }
    } catch (err) {
      console.error("Error fetching managers summary:", err);
      showToast("Error connecting to server.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchManagersSummaryData();
  }, [fetchManagersSummaryData]);

  const handleOpenManagerLeads = async (manager) => {
    setSelectedManager(manager);
    setDrawerOpen(true);
    setLeadsLoading(true);
    setLeadSearch("");
    setLeadStatusFilter("");
    setDrawerPage(0);

    try {
      const res = await getManagerAssignedLeads(manager.id);
      if (res?.success) {
        setManagerLeads(res.data || []);
      } else {
        showToast(res?.message || "Failed to fetch manager leads.", "error");
      }
    } catch (err) {
      console.error("Error fetching manager leads:", err);
      showToast("Error loading leads.", "error");
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleViewLeadDetail = async (leadId) => {
    setViewLeadId(leadId);
    setDetailsLoading(true);
    try {
      const res = await getLeadById(leadId);
      if (res?.success) {
        setLeadDetails(res.data);
      }
    } catch (err) {
      console.error("Error fetching lead detail:", err);
      showToast("Failed to fetch lead details", "error");
    } finally {
      setDetailsLoading(false);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalMgrs = managers.length;
    const totalAssigned = managers.reduce((sum, m) => sum + Number(m.total_assigned_leads || 0), 0);
    const totalReps = managers.reduce((sum, m) => sum + Number(m.active_team_members || 0), 0);
    const totalWon = managers.reduce((sum, m) => sum + Number(m.won_leads || 0), 0);
    const avgLeads = totalMgrs > 0 ? (totalAssigned / totalMgrs).toFixed(1) : "0";
    const winRate = totalAssigned > 0 ? ((totalWon / totalAssigned) * 100).toFixed(1) : "0.0";
    return { totalMgrs, totalAssigned, totalReps, totalWon, avgLeads, winRate };
  }, [managers]);

  // Filtered Managers
  const filteredManagers = useMemo(() => {
    return managers.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.username?.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "Active" ? m.status === "Active" : m.status !== "Active");

      let matchQuick = true;
      if (quickFilter === "with_leads") {
        matchQuick = Number(m.total_assigned_leads || 0) > 0;
      } else if (quickFilter === "with_won") {
        matchQuick = Number(m.won_leads || 0) > 0;
      } else if (quickFilter === "zero_leads") {
        matchQuick = Number(m.total_assigned_leads || 0) === 0;
      }

      return matchSearch && matchStatus && matchQuick;
    });
  }, [managers, search, statusFilter, quickFilter]);

  // Drawer status counts
  const drawerStatusCounts = useMemo(() => {
    const counts = { all: managerLeads.length };
    managerLeads.forEach((l) => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });
    return counts;
  }, [managerLeads]);

  // Filtered Drawer Leads
  const filteredDrawerLeads = useMemo(() => {
    return managerLeads.filter((l) => {
      const matchSearch =
        !leadSearch.trim() ||
        l.lead_code?.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.customer_name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.mobile_number?.includes(leadSearch) ||
        l.assigned_to_name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
        l.city?.toLowerCase().includes(leadSearch.toLowerCase());

      const matchStatus = !leadStatusFilter || l.status === leadStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [managerLeads, leadSearch, leadStatusFilter]);

  // Export Managers to CSV
  const handleExportCSV = () => {
    if (filteredManagers.length === 0) {
      showToast("No manager records to export", "warning");
      return;
    }
    const headers = [
      "Manager ID",
      "Full Name",
      "Username",
      "Email",
      "Phone",
      "Active Team Members",
      "Total Assigned Leads",
      "Won Leads",
      "Status",
    ];
    const rows = filteredManagers.map((m) => [
      `"${m.id || ""}"`,
      `"${m.full_name || ""}"`,
      `"${m.username || ""}"`,
      `"${m.email || ""}"`,
      `"${m.phone || ""}"`,
      `"${m.active_team_members || 0}"`,
      `"${m.total_assigned_leads || 0}"`,
      `"${m.won_leads || 0}"`,
      `"${m.status || "Active"}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Manager_Assignments_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredManagers.length} managers successfully.`);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setQuickFilter("all");
    setPage(0);
  };

  const hasActiveFilters = Boolean(search || statusFilter !== "all" || quickFilter !== "all");

  return (
    <Box
      style={{ zoom: 0.90 }}
      sx={{ backgroundColor: COLORS.bg, minHeight: "100vh", p: { xs: 1.5, sm: 2.5 }, width: "100%", boxSizing: "border-box" }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
        
        {/* 1. BREADCRUMBS */}
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.85rem", color: COLORS.textSecondary }} />}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon sx={{ fontSize: "0.95rem", color: COLORS.textSecondary }} />
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: COLORS.textSecondary, fontFamily: "'Inter', sans-serif" }}>
              Admin
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: COLORS.textSecondary, fontFamily: "'Inter', sans-serif" }}>
            User Governance
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.primary, fontFamily: "'Inter', sans-serif" }}>
            Manager Assignments
          </Typography>
        </Breadcrumbs>

        {/* 2. TOP HEADER & ACTION TOOLBAR (Clean style matching All Leads) */}
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS.primary, letterSpacing: -0.3, fontSize: { xs: "1.25rem", md: "1.45rem" } }}>
                Manager Lead Assignments
              </Typography>
              <Chip
                label={`${filteredManagers.length} Managers`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  backgroundColor: COLORS.primarySoft,
                  color: "#0369A1",
                  border: "1px solid #BAE6FD",
                  borderRadius: "10px",
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.3, fontSize: "0.82rem" }}>
              Track manager lead distribution, active sales team strength & conversion metrics.
            </Typography>
          </Box>

          {/* Action Toolbar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
            {/* View Mode Toggle: Box vs Table */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#E2E8F0",
                borderRadius: "10px",
                p: "3px",
                border: "1px solid #CBD5E1",
                height: 38,
                boxSizing: "border-box",
              }}
            >
              {[
                { mode: "table", label: "Table", icon: <TableRowsOutlinedIcon sx={{ fontSize: "1.05rem" }} /> },
                { mode: "box", label: "Grid", icon: <ViewAgendaOutlinedIcon sx={{ fontSize: "1.05rem" }} /> },
              ].map(({ mode, label, icon }) => {
                const isActive = viewMode === mode;
                return (
                  <Button
                    key={mode}
                    size="small"
                    onClick={() => setViewMode(mode)}
                    startIcon={icon}
                    sx={{
                      px: 1.4,
                      py: 0.4,
                      minHeight: 30,
                      height: 30,
                      fontSize: "0.78rem",
                      fontWeight: isActive ? 700 : 500,
                      textTransform: "none",
                      borderRadius: "7px",
                      backgroundColor: isActive ? "#FFFFFF" : "transparent",
                      color: isActive ? COLORS.primary : COLORS.textSecondary,
                      boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      "&:hover": {
                        backgroundColor: isActive ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                      },
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>

            {/* Export CSV */}
            <Tooltip title="Export to CSV">
              <span>
                <IconButton
                  onClick={handleExportCSV}
                  disabled={loading || filteredManagers.length === 0}
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    backgroundColor: "#FFFFFF",
                    color: COLORS.primary,
                    "&:hover": { backgroundColor: "#F8FAFC", borderColor: COLORS.accent },
                  }}
                >
                  <DownloadIcon sx={{ fontSize: "1.1rem" }} />
                </IconButton>
              </span>
            </Tooltip>

            {/* Refresh */}
            <Tooltip title="Refresh directory">
              <IconButton
                onClick={fetchManagersSummaryData}
                disabled={loading}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  backgroundColor: "#FFFFFF",
                  color: COLORS.primary,
                  "&:hover": { backgroundColor: "#F8FAFC", borderColor: COLORS.accent },
                }}
              >
                <RefreshIcon
                  sx={{
                    fontSize: "1.15rem",
                    animation: loading ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 3. KPI CARDS */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(5, 1fr)",
            },
            gap: 1.5,
            mb: 2.5,
            width: "100%",
          }}
        >
          <KpiCard
            icon={<GroupIcon sx={{ fontSize: 16 }} />}
            label="Total Managers"
            value={kpis.totalMgrs}
            subtext="Assignment controllers"
            accent={COLORS.primary}
            loading={loading}
          />
          <KpiCard
            icon={<AssignmentIndIcon sx={{ fontSize: 16 }} />}
            label="Assigned Leads"
            value={kpis.totalAssigned}
            subtext={`Avg. ${kpis.avgLeads} / manager`}
            accent={COLORS.accent}
            loading={loading}
          />
          <KpiCard
            icon={<PersonIcon sx={{ fontSize: 16 }} />}
            label="Active Sales Reps"
            value={kpis.totalReps}
            subtext="Team network capacity"
            accent={COLORS.purple}
            loading={loading}
          />
          <KpiCard
            icon={<WonIcon sx={{ fontSize: 16 }} />}
            label="Team Won Deals"
            value={kpis.totalWon}
            subtext={`${kpis.winRate}% conversion`}
            accent={COLORS.success}
            loading={loading}
          />
          <KpiCard
            icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
            label="Win Ratio"
            value={`${kpis.winRate}%`}
            subtext="Across all teams"
            accent={COLORS.warning}
            loading={loading}
          />
        </Box>

        {/* 4. FILTER PANEL */}
        <Paper elevation={0} sx={{ ...cardSx, p: 2, mb: 2.5, width: "100%", boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.5, width: "100%" }}>
            {/* Search Input */}
            <Box sx={{ flex: "1 1 240px", minWidth: 200 }}>
              <FieldLabel>Search Manager</FieldLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="Search name, email, phone, username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={controlSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: COLORS.textMuted }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Status Filter */}
            <Box sx={{ flex: "0 1 150px", minWidth: 120 }}>
              <FieldLabel>Manager Status</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={controlSx}
              >
                <MenuItem value="all" sx={{ fontSize: "0.8125rem" }}>All Statuses</MenuItem>
                <MenuItem value="Active" sx={{ fontSize: "0.8125rem" }}>Active</MenuItem>
                <MenuItem value="Inactive" sx={{ fontSize: "0.8125rem" }}>Inactive</MenuItem>
              </Select>
            </Box>

            {/* Quick Segment Filter Chips */}
            <Box sx={{ flex: "1 1 auto", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", pt: 1 }}>
              {[
                { key: "all", label: "All Managers" },
                { key: "with_leads", label: "With Leads" },
                { key: "with_won", label: "Won Deals > 0" },
                { key: "zero_leads", label: "Zero Leads" },
              ].map((qf) => {
                const isSel = quickFilter === qf.key;
                return (
                  <Chip
                    key={qf.key}
                    label={qf.label}
                    size="small"
                    onClick={() => setQuickFilter(qf.key)}
                    sx={{
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: isSel ? 700 : 500,
                      height: 28,
                      borderRadius: "8px",
                      backgroundColor: isSel ? COLORS.primarySoft : "#F1F5F9",
                      color: isSel ? COLORS.primary : COLORS.textSecondary,
                      border: `1px solid ${isSel ? "#BAE6FD" : "transparent"}`,
                      "&:hover": { backgroundColor: isSel ? COLORS.primarySoft : "#E2E8F0" },
                    }}
                  />
                );
              })}
            </Box>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                variant="text"
                size="small"
                startIcon={<FilterListOffIcon sx={{ fontSize: "1rem" }} />}
                onClick={handleResetFilters}
                sx={{
                  color: COLORS.danger,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  textTransform: "none",
                  height: 38,
                  px: 1.5,
                  "&:hover": { backgroundColor: COLORS.dangerSoft },
                }}
              >
                Reset Filters
              </Button>
            )}
          </Box>
        </Paper>

        {/* 5. VIEW MODE: BOX / CARD VIEW */}
        {viewMode === "box" ? (
          <Box>
            {loading ? (
              <Grid container spacing={2}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Skeleton variant="rounded" height={220} sx={{ borderRadius: "14px" }} />
                  </Grid>
                ))}
              </Grid>
            ) : filteredManagers.length === 0 ? (
              <Paper elevation={0} sx={{ ...cardSx, p: 6, textAlign: "center", color: COLORS.textMuted }}>
                <GroupIcon sx={{ fontSize: 44, color: COLORS.borderStrong, mb: 1.5, display: "block", mx: "auto" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                  No Managers Found
                </Typography>
                <Typography variant="caption" sx={{ color: COLORS.textSecondary, maxWidth: 380, display: "block", mx: "auto", mt: 0.5 }}>
                  No manager records match your selected filters. Try searching by another keyword or resetting filters.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {filteredManagers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((mgr) => {
                    const avatarUrl = resolveAvatar(mgr.profile_image);
                    const initials = getInitials(mgr.full_name);
                    const isMgrActive = mgr.status === "Active";
                    const assignedCount = Number(mgr.total_assigned_leads || 0);
                    const wonCount = Number(mgr.won_leads || 0);
                    const teamCount = Number(mgr.active_team_members || 0);
                    const conversionRate = assignedCount > 0 ? ((wonCount / assignedCount) * 100).toFixed(1) : "0.0";
                    const workloadPct = kpis.totalAssigned > 0 ? Math.min(100, Math.round((assignedCount / kpis.totalAssigned) * 100)) : 0;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={mgr.id}>
                        <Card
                          elevation={0}
                          sx={{
                            ...cardSx,
                            p: 2.2,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            height: "100%",
                            "&:hover": {
                              borderColor: COLORS.accent,
                              boxShadow: "0 8px 24px rgba(11,58,99,0.08)",
                              transform: "translateY(-3px)",
                            },
                          }}
                        >
                          {/* Card Top: Avatar, Name, Status */}
                          <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                  src={avatarUrl || undefined}
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    bgcolor: COLORS.primary,
                                    color: "#FFFFFF",
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    border: `2px solid ${COLORS.primarySoft}`,
                                  }}
                                >
                                  {initials}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: COLORS.textPrimary, lineHeight: 1.3 }} noWrap>
                                    {mgr.full_name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.75rem", display: "block" }}>
                                    @{mgr.username} • ID: #{mgr.id}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Chip
                                label={mgr.status || "Active"}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.6875rem",
                                  backgroundColor: isMgrActive ? COLORS.successSoft : COLORS.dangerSoft,
                                  color: isMgrActive ? COLORS.success : COLORS.danger,
                                  borderRadius: "6px",
                                  height: 22,
                                }}
                              />
                            </Box>

                            {/* Contact Details */}
                            <Stack spacing={0.6} sx={{ mb: 2, p: 1.2, backgroundColor: "#F8FAFC", borderRadius: "8px", border: `1px solid ${COLORS.border}` }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <PhoneIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                                <Typography
                                  component="a"
                                  href={`tel:${mgr.phone}`}
                                  sx={{
                                    fontSize: "0.78rem",
                                    color: COLORS.primary,
                                    textDecoration: "none",
                                    fontWeight: 600,
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  {mgr.phone || "No phone provided"}
                                </Typography>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <EmailIcon sx={{ fontSize: 14, color: COLORS.textMuted }} />
                                <Typography
                                  component="a"
                                  href={`mailto:${mgr.email}`}
                                  sx={{
                                    fontSize: "0.75rem",
                                    color: COLORS.textSecondary,
                                    textDecoration: "none",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {mgr.email}
                                </Typography>
                              </Box>
                            </Stack>

                            {/* 3 Metrics Mini Grid */}
                            <Grid container spacing={1} sx={{ mb: 1.8 }}>
                              <Grid item xs={4}>
                                <Box sx={{ p: 1, textAlign: "center", backgroundColor: COLORS.purpleSoft, borderRadius: "8px" }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.purple }}>
                                    {teamCount}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, fontWeight: 600 }}>
                                    Sales Reps
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box sx={{ p: 1, textAlign: "center", backgroundColor: COLORS.primarySoft, borderRadius: "8px" }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.primary }}>
                                    {assignedCount}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, fontWeight: 600 }}>
                                    Assigned
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={4}>
                                <Box sx={{ p: 1, textAlign: "center", backgroundColor: COLORS.successSoft, borderRadius: "8px" }}>
                                  <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.success }}>
                                    {wonCount}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, fontWeight: 600 }}>
                                    Won Deals
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>

                            {/* Workload Share Bar */}
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontSize: "0.7rem", color: COLORS.textSecondary, fontWeight: 600 }}>
                                  Org Workload Share
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: "0.7rem", color: COLORS.primary, fontWeight: 700 }}>
                                  {workloadPct}% ({conversionRate}% Won)
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={workloadPct}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: "#E2E8F0",
                                  "& .MuiLinearProgress-bar": {
                                    backgroundColor: COLORS.accent,
                                    borderRadius: 3,
                                  },
                                }}
                              />
                            </Box>
                          </Box>

                          {/* Action Button */}
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            endIcon={<ArrowForwardIcon sx={{ fontSize: "14px !important" }} />}
                            onClick={() => handleOpenManagerLeads(mgr)}
                            sx={{
                              borderColor: COLORS.primary,
                              color: COLORS.primary,
                              textTransform: "none",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              borderRadius: "8px",
                              py: 0.8,
                              backgroundColor: "#FFFFFF",
                              "&:hover": {
                                backgroundColor: COLORS.primarySoft,
                                borderColor: COLORS.accent,
                              },
                            }}
                          >
                            View Assigned Leads ({assignedCount})
                          </Button>
                        </Card>
                      </Grid>
                    );
                  })}
              </Grid>
            )}

            {/* Pagination for Box View */}
            <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end" }}>
              <TablePagination
                rowsPerPageOptions={[6, 12, 24]}
                component="div"
                count={filteredManagers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                sx={{ border: "none", fontSize: "0.8125rem" }}
              />
            </Box>
          </Box>
        ) : (
          /* 6. VIEW MODE: TABLE VIEW */
          <Paper elevation={0} sx={{ ...cardSx, overflow: "hidden", width: "100%" }}>
            <TableContainer
              sx={{
                width: "100%",
                overflowX: "auto",
                "&::-webkit-scrollbar": { height: "7px" },
                "&::-webkit-scrollbar-track": { backgroundColor: "#F1F5F9", borderRadius: "4px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#CBD5E1",
                  borderRadius: "4px",
                  "&:hover": { backgroundColor: "#94A3B8" },
                },
              }}
            >
              <Table size="small" sx={{ minWidth: 980, width: "100%" }}>
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        backgroundColor: "#F8FAFC",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        py: 1.4,
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    <TableCell sx={{ px: 2, minWidth: 230 }}>MANAGER PROFILE</TableCell>
                    <TableCell sx={{ px: 2, minWidth: 210 }}>CONTACT DETAILS</TableCell>
                    <TableCell sx={{ px: 1.5, minWidth: 140 }} align="center">ACTIVE SALES REPS</TableCell>
                    <TableCell sx={{ px: 1.5, minWidth: 160 }} align="center">ASSIGNED PIPELINE</TableCell>
                    <TableCell sx={{ px: 1, minWidth: 90 }} align="center">STATUS</TableCell>
                    <TableCell sx={{ px: 2, minWidth: 130 }} align="right">ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell colSpan={6} sx={{ py: 2 }}>
                          <Skeleton variant="rounded" height={36} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredManagers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: "center", py: 6, color: COLORS.textMuted }}>
                        <GroupIcon sx={{ fontSize: 40, color: COLORS.borderStrong, mb: 1, display: "block", mx: "auto" }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                          No Managers Found
                        </Typography>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                          No manager records matching your search criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredManagers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((mgr) => {
                        const avatarUrl = resolveAvatar(mgr.profile_image);
                        const initials = getInitials(mgr.full_name);
                        const isMgrActive = mgr.status === "Active";
                        const assignedCount = Number(mgr.total_assigned_leads || 0);
                        const wonCount = Number(mgr.won_leads || 0);

                        return (
                          <TableRow
                            key={mgr.id}
                            hover
                            sx={{
                              "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 1.4 },
                              "&:hover": { backgroundColor: "#F8FAFC" },
                            }}
                          >
                            {/* Profile */}
                            <TableCell sx={{ minWidth: 200, px: 2 }}>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                  src={avatarUrl || undefined}
                                  sx={{
                                    width: 38,
                                    height: 38,
                                    bgcolor: COLORS.primary,
                                    color: "#FFFFFF",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {initials}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary }} noWrap>
                                    {mgr.full_name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }} noWrap>
                                    @{mgr.username} • ID: #{mgr.id}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            {/* Contact */}
                            <TableCell sx={{ minWidth: 190, px: 2 }}>
                              <Typography
                                component="a"
                                href={`tel:${mgr.phone}`}
                                sx={{
                                  fontSize: "0.8125rem",
                                  color: COLORS.primary,
                                  fontWeight: 600,
                                  textDecoration: "none",
                                  display: "block",
                                  "&:hover": { textDecoration: "underline" },
                                }}
                              >
                                {mgr.phone || "—"}
                              </Typography>
                              <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }} noWrap>
                                {mgr.email}
                              </Typography>
                            </TableCell>

                            {/* Active Team */}
                            <TableCell sx={{ minWidth: 130, px: 1.5 }} align="center">
                              <Chip
                                icon={<GroupIcon sx={{ fontSize: "14px !important" }} />}
                                label={`${mgr.active_team_members || 0} Reps`}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  backgroundColor: COLORS.purpleSoft,
                                  color: COLORS.purple,
                                  borderRadius: "8px",
                                  px: 0.5,
                                }}
                              />
                            </TableCell>

                            {/* Leads Assigned */}
                            <TableCell sx={{ minWidth: 150, px: 1.5 }} align="center">
                              <Stack direction="column" alignItems="center" spacing={0.3}>
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    px: 1.2,
                                    py: 0.35,
                                    borderRadius: "8px",
                                    backgroundColor: COLORS.primarySoft,
                                    color: COLORS.primary,
                                    fontWeight: 800,
                                    fontSize: "0.8125rem",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {`${assignedCount} Leads`}
                                </Box>
                                {assignedCount > 0 && (
                                  <Typography variant="caption" sx={{ fontSize: "0.68rem", color: COLORS.textMuted, whiteSpace: "nowrap" }}>
                                    Won: {wonCount} • Active: {assignedCount - wonCount}
                                  </Typography>
                                )}
                              </Stack>
                            </TableCell>

                            {/* Status */}
                            <TableCell sx={{ minWidth: 90, px: 1.5 }} align="center">
                              <Chip
                                label={mgr.status || "Active"}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.6875rem",
                                  backgroundColor: isMgrActive ? COLORS.successSoft : COLORS.dangerSoft,
                                  color: isMgrActive ? COLORS.success : COLORS.danger,
                                  borderRadius: "6px",
                                  height: 22,
                                }}
                              />
                            </TableCell>

                            {/* Action */}
                            <TableCell sx={{ minWidth: 130, px: 2 }} align="right">
                              <Button
                                variant="contained"
                                size="small"
                                endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                                onClick={() => handleOpenManagerLeads(mgr)}
                                sx={{
                                  backgroundColor: COLORS.primary,
                                  color: "#FFFFFF",
                                  textTransform: "none",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  borderRadius: "8px",
                                  px: 1.4,
                                  py: 0.5,
                                  whiteSpace: "nowrap",
                                  "&:hover": {
                                    backgroundColor: COLORS.primaryDark,
                                  },
                                }}
                              >
                                View Leads
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredManagers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{ borderTop: `1px solid ${COLORS.border}`, fontSize: "0.8125rem" }}
            />
          </Paper>
        )}

        {/* 7. DRILL-DOWN DETAIL DRAWER */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: "100%", md: "78%", lg: "70%" },
              p: 0,
              backgroundColor: COLORS.bg,
            },
          }}
        >
          {selectedManager && (
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              {/* Drawer Top Header Banner */}
              <Box
                sx={{
                  p: 2.5,
                  background: `linear-gradient(135deg, #0B3A63 0%, #005BAC 100%)`,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={resolveAvatar(selectedManager.profile_image) || undefined}
                    sx={{ width: 48, height: 48, bgcolor: "#FFFFFF", color: COLORS.primary, fontWeight: 800 }}
                  >
                    {getInitials(selectedManager.full_name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.2 }}>
                      {selectedManager.full_name}'s Assigned Leads
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#BAE6FD", fontSize: "0.78rem", display: "block", mt: 0.3 }}>
                      Phone: {selectedManager.phone || "—"} • Email: {selectedManager.email} • {selectedManager.active_team_members || 0} Team Reps
                    </Typography>
                  </Box>
                </Stack>
                <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "#FFFFFF", "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" } }}>
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Status Breakdown Pills inside Drawer */}
              <Box sx={{ px: 2, pt: 2, pb: 0.5, overflowX: "auto" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={`All (${drawerStatusCounts.all || 0})`}
                    size="small"
                    onClick={() => setLeadStatusFilter("")}
                    sx={{
                      cursor: "pointer",
                      fontWeight: !leadStatusFilter ? 700 : 500,
                      backgroundColor: !leadStatusFilter ? COLORS.primary : "#FFFFFF",
                      color: !leadStatusFilter ? "#FFFFFF" : COLORS.textSecondary,
                      border: `1px solid ${!leadStatusFilter ? COLORS.primary : COLORS.border}`,
                    }}
                  />
                  {STATUS_OPTIONS.map((st) => {
                    const count = drawerStatusCounts[st] || 0;
                    if (count === 0 && leadStatusFilter !== st) return null;
                    const isSel = leadStatusFilter === st;
                    return (
                      <Chip
                        key={st}
                        label={`${st} (${count})`}
                        size="small"
                        onClick={() => setLeadStatusFilter(isSel ? "" : st)}
                        sx={{
                          cursor: "pointer",
                          fontWeight: isSel ? 700 : 500,
                          backgroundColor: isSel ? COLORS.accent : "#FFFFFF",
                          color: isSel ? "#FFFFFF" : COLORS.textSecondary,
                          border: `1px solid ${isSel ? COLORS.accent : COLORS.border}`,
                        }}
                      />
                    );
                  })}
                </Stack>
              </Box>

              {/* Drawer Search & Action Bar */}
              <Paper elevation={0} sx={{ p: 1.5, m: 2, ...cardSx }}>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search customer, mobile, lead code, sales rep, city..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      sx={controlSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ color: COLORS.textMuted }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ textAlign: { xs: "left", sm: "right" } }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, fontSize: "0.8rem" }}>
                      Showing {filteredDrawerLeads.length} of {managerLeads.length} Leads
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Leads Table Container */}
              <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2 }}>
                <Paper elevation={0} sx={{ ...cardSx, overflow: "hidden" }}>
                  <TableContainer>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow
                          sx={{
                            "& th": {
                              backgroundColor: "#F8FAFC",
                              fontWeight: 700,
                              fontSize: "0.72rem",
                              color: "#475569",
                              textTransform: "uppercase",
                              py: 1.2,
                            },
                          }}
                        >
                          <TableCell>LEAD CODE</TableCell>
                          <TableCell>CUSTOMER & CONTACT</TableCell>
                          <TableCell>ASSIGNED SALES REP</TableCell>
                          <TableCell>ASSIGNED DATE</TableCell>
                          <TableCell>STATUS</TableCell>
                          <TableCell>LOCATION</TableCell>
                          <TableCell>CAPACITY</TableCell>
                          <TableCell align="right">ACTIONS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leadsLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell colSpan={8} sx={{ py: 1.5 }}>
                                <Skeleton variant="rounded" height={28} />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : filteredDrawerLeads.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} sx={{ textAlign: "center", py: 5, color: COLORS.textMuted }}>
                              <FilterListOffIcon sx={{ fontSize: 32, mb: 1, color: COLORS.borderStrong }} />
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                                No Leads Found
                              </Typography>
                              <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                                No assigned leads match your current search/filter criteria.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredDrawerLeads
                            .slice(drawerPage * drawerRowsPerPage, drawerPage * drawerRowsPerPage + drawerRowsPerPage)
                            .map((lead) => {
                              const cleanPhone = String(lead.mobile_number || "").replace(/\D/g, "");

                              return (
                                <TableRow key={lead.id} hover sx={{ "& td": { py: 1.2, borderBottom: `1px solid ${COLORS.border}` } }}>
                                  {/* Lead Code */}
                                  <TableCell>
                                    <Typography sx={{ fontWeight: 700, color: COLORS.primary, fontSize: "0.78rem" }}>
                                      {lead.lead_code || `#${lead.id}`}
                                    </Typography>
                                  </TableCell>

                                  {/* Customer & Contact */}
                                  <TableCell>
                                    <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: COLORS.textPrimary }}>
                                      {lead.customer_name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, display: "block" }}>
                                      {lead.mobile_number}
                                    </Typography>
                                  </TableCell>

                                  {/* Assigned Sales Rep */}
                                  <TableCell>
                                    {lead.assigned_to_name ? (
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar
                                          src={resolveAvatar(lead.assigned_to_image) || undefined}
                                          sx={{ width: 24, height: 24, fontSize: "0.65rem", bgcolor: COLORS.purple, fontWeight: 700 }}
                                        >
                                          {getInitials(lead.assigned_to_name)}
                                        </Avatar>
                                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: COLORS.textPrimary }}>
                                          {lead.assigned_to_name}
                                        </Typography>
                                      </Stack>
                                    ) : (
                                      <Chip
                                        label="Unassigned"
                                        size="small"
                                        sx={{ fontSize: "0.68rem", height: 20, bgcolor: COLORS.warningSoft, color: COLORS.warning }}
                                      />
                                    )}
                                  </TableCell>

                                  {/* Assigned Date */}
                                  <TableCell>
                                    <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                                      {formatDate(lead.created_at || lead.updated_at)}
                                    </Typography>
                                  </TableCell>

                                  {/* Status */}
                                  <TableCell>
                                    <StatusChip status={lead.status} />
                                  </TableCell>

                                  {/* Location */}
                                  <TableCell>
                                    <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                                      {lead.city || "—"}
                                    </Typography>
                                  </TableCell>

                                  {/* Capacity */}
                                  <TableCell>
                                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textPrimary }}>
                                      {lead.required_kw ? `${lead.required_kw} kW` : "—"}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>
                                      {lead.solar_requirement || "Residential"}
                                    </Typography>
                                  </TableCell>

                                  {/* Quick Actions */}
                                  <TableCell align="right">
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                      {cleanPhone && (
                                        <>
                                          <Tooltip title="Call Customer">
                                            <IconButton
                                              component="a"
                                              href={`tel:${cleanPhone}`}
                                              size="small"
                                              sx={{
                                                color: COLORS.primary,
                                                bgcolor: "#F8FAFC",
                                                border: `1px solid ${COLORS.border}`,
                                                p: "5px",
                                                "&:hover": { bgcolor: COLORS.primarySoft },
                                              }}
                                            >
                                              <CallIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="WhatsApp Customer">
                                            <IconButton
                                              component="a"
                                              href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                                              target="_blank"
                                              size="small"
                                              sx={{
                                                color: COLORS.success,
                                                bgcolor: "#F8FAFC",
                                                border: `1px solid ${COLORS.border}`,
                                                p: "5px",
                                                "&:hover": { bgcolor: COLORS.successSoft },
                                              }}
                                            >
                                              <WhatsAppIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                          </Tooltip>
                                        </>
                                      )}
                                      <Tooltip title="View Lead Details">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleViewLeadDetail(lead.id)}
                                          sx={{
                                            color: COLORS.accent,
                                            bgcolor: "#F8FAFC",
                                            border: `1px solid ${COLORS.border}`,
                                            p: "5px",
                                            "&:hover": { bgcolor: COLORS.primarySoft },
                                          }}
                                        >
                                          <ViewIcon sx={{ fontSize: 14 }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    rowsPerPageOptions={[5, 10, 20]}
                    component="div"
                    count={filteredDrawerLeads.length}
                    rowsPerPage={drawerRowsPerPage}
                    page={drawerPage}
                    onPageChange={(_, newPage) => setDrawerPage(newPage)}
                    onRowsPerPageChange={(e) => {
                      setDrawerRowsPerPage(parseInt(e.target.value, 10));
                      setDrawerPage(0);
                    }}
                    sx={{ borderTop: `1px solid ${COLORS.border}`, fontSize: "0.8125rem" }}
                  />
                </Paper>
              </Box>
            </Box>
          )}
        </Drawer>

        {/* 8. QUICK LEAD DETAIL MODAL */}
        <Dialog
          open={Boolean(viewLeadId)}
          onClose={() => setViewLeadId(null)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: COLORS.primaryDark, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Lead #{leadDetails?.lead_code || viewLeadId} Details</span>
            <IconButton size="small" onClick={() => setViewLeadId(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {detailsLoading ? (
              <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={28} sx={{ color: COLORS.primary }} />
              </Box>
            ) : leadDetails ? (
              <Stack spacing={2}>
                <Box sx={{ p: 1.5, backgroundColor: "#F8FAFC", borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                    {leadDetails.customer_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                    Phone: {leadDetails.mobile_number} • Email: {leadDetails.email || "N/A"}
                  </Typography>
                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                    <StatusChip status={leadDetails.status} />
                    {leadDetails.required_kw && (
                      <Chip label={`${leadDetails.required_kw} kW`} size="small" sx={{ fontSize: "0.7rem", height: 22 }} />
                    )}
                  </Box>
                </Box>

                <Grid container spacing={1.5}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 600 }}>
                      ASSIGNED SALES REP
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                      {leadDetails.assigned_to_name || "Unassigned"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 600 }}>
                      ASSIGNED BY MANAGER
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                      {leadDetails.assigned_by_name || "Direct System"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 600 }}>
                      LOCATION
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.textPrimary }}>
                      {leadDetails.city || "—"}, {leadDetails.state || "—"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 600 }}>
                      QUOTATION AMOUNT
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.success }}>
                      {leadDetails.quotation_amount ? `₹${Number(leadDetails.quotation_amount).toLocaleString("en-IN")}` : "Not Sent"}
                    </Typography>
                  </Grid>
                  {leadDetails.remark && (
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 600 }}>
                        REMARK / NOTE
                      </Typography>
                      <Typography variant="body2" sx={{ color: COLORS.textSecondary, backgroundColor: "#F8FAFC", p: 1, borderRadius: "6px" }}>
                        {leadDetails.remark}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Stack>
            ) : (
              <Typography variant="body2" color="error">Lead details not available.</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2, py: 1.5 }}>
            <Button onClick={() => setViewLeadId(null)} sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* 9. SNACKBAR NOTIFICATION */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <MuiAlert severity={snackbar.severity} variant="filled" sx={{ width: "100%", borderRadius: "8px" }}>
            {snackbar.message}
          </MuiAlert>
        </Snackbar>

      </Box>
    </Box>
  );
}

export default ManagerAssignments;
