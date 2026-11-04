import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Tooltip,
  Menu,
  Divider,
  InputAdornment,
  Stack,
} from "@mui/material";

// Icons
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";

import { getFollowupDirectory, addFollowup, getFollowups } from "../../services/leadService";
import { getUsers } from "../../services/userServices";

const COLORS = {
  primary: "#0B3A63",
  primaryHover: "#082F52",
  accent: "#005BAC",
  sky: "#38BDF8",
  bg: "#F8FAFC",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case "New Lead":
      return { bg: "#E0F2FE", color: "#0369A1", border: "#BAE6FD" };
    case "Site Visit Scheduled":
      return { bg: "#F3E8FF", color: "#7E22CE", border: "#E9D5FF" };
    case "Quotation Sent":
      return { bg: "#FEF3C7", color: "#B45309", border: "#FDE68A" };
    case "Follow-up Required":
      return { bg: "#FEF9C3", color: "#A16207", border: "#FEF08A" };
    case "Won":
      return { bg: "#DCFCE7", color: "#15803D", border: "#BBF7D0" };
    case "Lost":
    case "Not Interested":
      return { bg: "#FEE2E2", color: "#B91C1C", border: "#FECACA" };
    default:
      return { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" };
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "High":
      return { bg: "#FEE2E2", color: "#DC2626" };
    case "Medium":
      return { bg: "#FEF3C7", color: "#D97706" };
    case "Low":
      return { bg: "#F1F5F9", color: "#64748B" };
    default:
      return { bg: "#F1F5F9", color: "#64748B" };
  }
};

export default function TodaysFollowup() {
  const navigate = useNavigate();

  // State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // 'box' | 'table' | 'grid'
  const [period, setPeriod] = useState("today"); // 'today' | 'overdue' | 'upcoming' | 'not_scheduled' | 'all'
  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [assignedFilter, setAssignedFilter] = useState("All");
  const [usersList, setUsersList] = useState([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // History Remarks Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeLeadForHistory, setActiveLeadForHistory] = useState(null);
  const [historyRemarks, setHistoryRemarks] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Reschedule Follow-up Modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [activeLeadForReschedule, setActiveLeadForReschedule] = useState(null);
  const [newFollowupDate, setNewFollowupDate] = useState("");
  const [newFollowupNote, setNewFollowupNote] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  // Inline remarks draft map: { [leadId]: text }
  const [inlineRemarks, setInlineRemarks] = useState({});
  const [savingRemarkLeadId, setSavingRemarkLeadId] = useState(null);

  // Feedback Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Load Users List for Assigned Filter
  useEffect(() => {
    (async () => {
      try {
        const res = await getUsers({ limit: 100 });
        if (res?.data?.success) {
          setUsersList(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch users list:", err);
      }
    })();
  }, []);

  // Fetch Directory Leads
  const fetchDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        period: selectedDate ? "" : period,
        date: selectedDate,
        search,
        status: statusFilter,
        priority: priorityFilter,
        assigned_to: assignedFilter,
      };
      const res = await getFollowupDirectory(params);
      if (res?.success) {
        setLeads(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching follow-up directory:", err);
      setSnackbar({
        open: true,
        message: "Failed to load follow-up directory.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [period, selectedDate, search, statusFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Reset Filters
  const handleResetFilters = () => {
    setPeriod("today");
    setSelectedDate("");
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setAssignedFilter("All");
    setPage(0);
  };

  // Submit Quick Inline Remark
  const handleInlineRemarkSubmit = async (leadId) => {
    const text = (inlineRemarks[leadId] || "").trim();
    if (!text) return;

    setSavingRemarkLeadId(leadId);
    try {
      await addFollowup(leadId, {
        note: text,
        followup_type: "Call",
      });
      setInlineRemarks((prev) => ({ ...prev, [leadId]: "" }));
      setSnackbar({
        open: true,
        message: "Remark added successfully!",
        severity: "success",
      });
      fetchDirectory();
    } catch (err) {
      console.error("Failed to add inline remark:", err);
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || "Failed to add remark.",
        severity: "error",
      });
    } finally {
      setSavingRemarkLeadId(null);
    }
  };

  // Open Remark History
  const handleOpenHistory = async (lead) => {
    setActiveLeadForHistory(lead);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await getFollowups(lead.id);
      let remarksList = [];
      if (res?.success && Array.isArray(res.data)) {
        remarksList = [...res.data];
      }

      if (lead.remark) {
        const alreadyIncluded = remarksList.some(
          (r) => r.note && r.note.trim() === lead.remark.trim()
        );
        if (!alreadyIncluded) {
          remarksList.push({
            id: 'initial-' + lead.id,
            followup_type: 'Initial Note',
            note: lead.remark,
            created_at: lead.created_at || lead.updated_at,
            created_by_name: lead.created_by_name || 'System / Lead Note',
          });
        }
      }

      remarksList.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setHistoryRemarks(remarksList);
    } catch (err) {
      console.error("Failed to load followups:", err);
      if (lead.remark) {
        setHistoryRemarks([
          {
            id: 'initial-' + lead.id,
            followup_type: 'Initial Note',
            note: lead.remark,
            created_at: lead.created_at || lead.updated_at,
            created_by_name: lead.created_by_name || 'System',
          },
        ]);
      } else {
        setHistoryRemarks([]);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  // Open Reschedule Modal
  const handleOpenReschedule = (lead) => {
    setActiveLeadForReschedule(lead);
    setNewFollowupDate(
      lead.next_follow_up_date
        ? new Date(lead.next_follow_up_date).toISOString().split("T")[0]
        : ""
    );
    setNewFollowupNote("");
    setRescheduleModalOpen(true);
  };

  // Submit Reschedule Follow-up
  const handleSaveReschedule = async () => {
    if (!activeLeadForReschedule || !newFollowupDate) {
      setSnackbar({
        open: true,
        message: "Please select a valid follow-up date.",
        severity: "warning",
      });
      return;
    }

    setRescheduleSubmitting(true);
    try {
      await addFollowup(activeLeadForReschedule.id, {
        note: newFollowupNote.trim() || `Rescheduled follow-up to ${newFollowupDate}`,
        follow_up_date: newFollowupDate,
        followup_type: "Call",
      });
      setRescheduleModalOpen(false);
      setSnackbar({
        open: true,
        message: "Follow-up rescheduled successfully!",
        severity: "success",
      });
      fetchDirectory();
    } catch (err) {
      console.error("Failed to reschedule follow-up:", err);
      setSnackbar({
        open: true,
        message: err?.response?.data?.message || "Failed to reschedule follow-up.",
        severity: "error",
      });
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  // Paginated Sliced leads
  const paginatedLeads = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return leads.slice(startIndex, startIndex + rowsPerPage);
  }, [leads, page, rowsPerPage]);

  // Current display label
  const activePeriodLabel = useMemo(() => {
    if (selectedDate) return `Custom: ${formatDate(selectedDate)}`;
    switch (period) {
      case "today":
        return `Today (${formatDate(new Date())})`;
      case "overdue":
        return "Overdue Pipeline";
      case "upcoming":
        return "Upcoming Follow-ups";
      case "not_scheduled":
        return "Unscheduled Leads";
      case "all":
        return "All Follow-ups";
      default:
        return "Today";
    }
  }, [selectedDate, period]);

  return (
    <Box sx={{ p: { xs: 0.5, sm: 1 }, backgroundColor: "transparent" }}>
      {/* 1. BREADCRUMBS */}
      <Breadcrumbs
        separator={<NavigateNextRoundedIcon sx={{ fontSize: "1rem", color: COLORS.textSecondary }} />}
        sx={{ mb: 1.5 }}
      >
        <Link
          underline="hover"
          color="inherit"
          onClick={() => navigate("/dashboard")}
          sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", fontSize: "0.82rem" }}
        >
          <HomeOutlinedIcon sx={{ fontSize: "1rem" }} />
          Dashboard
        </Link>
        <Link
          underline="hover"
          color="inherit"
          onClick={() => navigate("/leads")}
          sx={{ cursor: "pointer", fontSize: "0.82rem" }}
        >
          Lead Management
        </Link>
        <Typography color="text.primary" sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.primary }}>
          Today's Follow-up
        </Typography>
      </Breadcrumbs>

      {/* 2. TOP HEADER & ACTION TOOLBAR */}
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
              Today's Follow-up Directory
            </Typography>
            <Chip
              label={`${leads.length} Follow-ups`}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.72rem",
                fontWeight: 700,
                backgroundColor: "#E0F2FE",
                color: "#0369A1",
                border: "1px solid #BAE6FD",
                borderRadius: "10px",
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.3, fontSize: "0.82rem" }}>
            Scheduled customer actions, site visit follow-ups & overdue pipeline tracker.
          </Typography>
        </Box>

        {/* Action Controls Toolbar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            flexWrap: "nowrap",
            width: { xs: "100%", sm: "auto" },
            justifyContent: { xs: "space-between", sm: "flex-end" },
          }}
        >
          {/* Segmented View Mode Toggle */}
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
                    whiteSpace: "nowrap",
                    backgroundColor: isActive ? "#FFFFFF" : "transparent",
                    color: isActive ? COLORS.accent : COLORS.textSecondary,
                    boxShadow: isActive ? "0 1px 3px rgba(0, 91, 172, 0.12)" : "none",
                    transition: "all 0.18s ease-in-out",
                    "&:hover": {
                      backgroundColor: isActive ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                      color: isActive ? COLORS.accent : COLORS.textPrimary,
                    },
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </Box>

          {/* Refresh Directory Button */}
          <Tooltip title="Refresh directory">
            <IconButton
              onClick={fetchDirectory}
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: "#FFFFFF",
                color: COLORS.primary,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                "&:hover": {
                  backgroundColor: "#F8FAFC",
                  borderColor: COLORS.accent,
                  color: COLORS.accent,
                },
              }}
            >
              <RefreshRoundedIcon
                sx={{
                  fontSize: "1.15rem",
                  animation: loading ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
                }}
              />
            </IconButton>
          </Tooltip>

          {/* Primary Action Button: Add Lead */}
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddRoundedIcon sx={{ fontSize: "1.15rem" }} />}
            onClick={() => navigate("/leads", { state: { openAddLead: Date.now() } })}
            sx={{
              height: 38,
              minHeight: 38,
              px: 2.2,
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.84rem",
              textTransform: "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: "linear-gradient(135deg, #0B3A63 0%, #005BAC 100%)",
              color: "#FFFFFF",
              boxShadow: "0 3px 10px rgba(0, 91, 172, 0.25)",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                background: "linear-gradient(135deg, #082F52 0%, #004C91 100%)",
                boxShadow: "0 6px 16px rgba(0, 91, 172, 0.35)",
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            Add Lead
          </Button>
        </Box>
      </Box>

      {/* 3. UNIFIED MASTER FILTER CONTROL PANEL */}
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        {/* ROW 1: Period Pills & Date Filter */}
        <Box
          sx={{
            p: 1.5,
            px: 2,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            backgroundColor: "#FAFCFF",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          {/* Period Pills */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: COLORS.textSecondary,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                mr: 0.5,
              }}
            >
              Filter Period:
            </Typography>

            {[
              { id: "today", label: "Today" },
              { id: "overdue", label: "Overdue" },
              { id: "upcoming", label: "Upcoming" },
              { id: "not_scheduled", label: "Not Scheduled" },
              { id: "all", label: "All Follow-ups" },
            ].map((tab) => {
              const isTabActive = !selectedDate && period === tab.id;
              return (
                <Chip
                  key={tab.id}
                  label={tab.label}
                  clickable
                  onClick={() => {
                    setSelectedDate("");
                    setPeriod(tab.id);
                    setPage(0);
                  }}
                  sx={{
                    fontWeight: isTabActive ? 700 : 600,
                    fontSize: "0.78rem",
                    height: 32,
                    px: 0.8,
                    borderRadius: "20px",
                    backgroundColor: isTabActive ? COLORS.primary : "#FFFFFF",
                    color: isTabActive ? "#FFFFFF" : COLORS.textPrimary,
                    border: isTabActive ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                    boxShadow: isTabActive ? "0 2px 6px rgba(11, 58, 99, 0.25)" : "none",
                    transition: "all 0.18s ease",
                    "&:hover": {
                      backgroundColor: isTabActive ? COLORS.primaryHover : "#F1F5F9",
                      borderColor: isTabActive ? COLORS.primaryHover : "#CBD5E1",
                    },
                  }}
                />
              );
            })}
          </Box>

          {/* Date Picker & Current View Badge */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "nowrap" }}>
            <TextField
              type="date"
              size="small"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(0);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                width: 155,
                "& .MuiInputBase-root": {
                  height: 34,
                  fontSize: "0.78rem",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${COLORS.border}`,
                  "& fieldset": { border: "none" },
                  "&:hover": { borderColor: COLORS.accent },
                },
              }}
            />

            {selectedDate && (
              <Tooltip title="Clear specific date">
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedDate("");
                    setPeriod("today");
                    setPage(0);
                  }}
                  sx={{ p: 0.5, color: COLORS.textSecondary }}
                >
                  <CloseRoundedIcon sx={{ fontSize: "1rem" }} />
                </IconButton>
              </Tooltip>
            )}

            <Chip
              icon={<CalendarMonthOutlinedIcon style={{ fontSize: "0.95rem", color: "#005BAC" }} />}
              label={activePeriodLabel}
              sx={{
                backgroundColor: "#EFF6FF",
                color: "#1E40AF",
                fontWeight: 700,
                fontSize: "0.76rem",
                border: "1px solid #BFDBFE",
                height: 34,
                borderRadius: "8px",
                px: 0.5,
              }}
            />
          </Box>
        </Box>

        {/* ROW 2: Search, Status, Priority, Assigned, Reset */}
        <Box sx={{ p: 1.8, px: 2 }}>
          <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
            {/* Search Input */}
            <Grid xs={12} sm={6} md={3.8}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by customer name, phone, city..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ fontSize: "1.1rem", color: "#94A3B8" }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  "& .MuiInputBase-root": {
                    height: 38,
                    borderRadius: "9px",
                    fontSize: "0.82rem",
                    backgroundColor: "#F8FAFC",
                  },
                }}
              />
            </Grid>

            {/* Status Dropdown */}
            <Grid xs={6} sm={3} md={2.4}>
              <FormControl fullWidth size="small">
                <Select
                  value={statusFilter}
                  displayEmpty
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    height: 38,
                    borderRadius: "9px",
                    fontSize: "0.82rem",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <MenuItem value="All">All Statuses</MenuItem>
                  <MenuItem value="New Lead">New Lead</MenuItem>
                  <MenuItem value="Site Visit Scheduled">Site Visit Scheduled</MenuItem>
                  <MenuItem value="Quotation Sent">Quotation Sent</MenuItem>
                  <MenuItem value="Follow-up Required">Follow-up Required</MenuItem>
                  <MenuItem value="Won">Won Deals</MenuItem>
                  <MenuItem value="Lost">Lost</MenuItem>
                  <MenuItem value="Not Interested">Not Interested</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Priority Dropdown */}
            <Grid xs={6} sm={3} md={2.0}>
              <FormControl fullWidth size="small">
                <Select
                  value={priorityFilter}
                  displayEmpty
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    height: 38,
                    borderRadius: "9px",
                    fontSize: "0.82rem",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <MenuItem value="All">All Priorities</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Assigned Staff Dropdown */}
            <Grid xs={8} sm={4} md={2.4}>
              <FormControl fullWidth size="small">
                <Select
                  value={assignedFilter}
                  displayEmpty
                  onChange={(e) => {
                    setAssignedFilter(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    height: 38,
                    borderRadius: "9px",
                    fontSize: "0.82rem",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  <MenuItem value="All">All Staff (Everyone)</MenuItem>
                  {usersList.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Reset Button */}
            <Grid xs={4} sm={2} md={1.4} sx={{ textAlign: "right" }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={handleResetFilters}
                startIcon={<RestartAltRoundedIcon sx={{ fontSize: "1.05rem" }} />}
                sx={{
                  height: 38,
                  borderRadius: "9px",
                  borderColor: COLORS.border,
                  color: COLORS.textSecondary,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  backgroundColor: "#FFFFFF",
                  "&:hover": {
                    borderColor: COLORS.accent,
                    backgroundColor: "#F0F9FF",
                    color: COLORS.accent,
                  },
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* 4. MAIN CONTENT DISPLAY (BOX / TABLE / GRID) */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10, flexDirection: "column", gap: 1.5 }}>
          <CircularProgress size={38} sx={{ color: COLORS.accent }} />
          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
            Loading follow-up records...
          </Typography>
        </Box>
      ) : leads.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 3,
            textAlign: "center",
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "#EFF6FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CalendarMonthOutlinedIcon sx={{ fontSize: "2.2rem", color: "#005BAC" }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: COLORS.textPrimary, mb: 0.5, fontSize: "1.1rem" }}>
            No Follow-ups Found for {activePeriodLabel}
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, maxWidth: 460, margin: "0 auto", fontSize: "0.84rem" }}>
            There are no leads scheduled under this filter. You can switch to All Follow-ups to inspect your full lead database or clear active filters.
          </Typography>
          <Box sx={{ display: "flex", gap: 1.2, justifyContent: "center", mt: 2.5 }}>
            <Button
              variant="contained"
              onClick={() => {
                setSelectedDate("");
                setPeriod("all");
                setPage(0);
              }}
              sx={{
                backgroundColor: COLORS.accent,
                textTransform: "none",
                borderRadius: "9px",
                fontWeight: 700,
                fontSize: "0.82rem",
                px: 2.2,
                "&:hover": { backgroundColor: "#004B8F" },
              }}
            >
              View All Follow-ups
            </Button>
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              sx={{
                borderColor: COLORS.border,
                color: COLORS.textSecondary,
                textTransform: "none",
                borderRadius: "9px",
                fontWeight: 600,
                fontSize: "0.82rem",
                px: 2,
                "&:hover": { borderColor: "#94A3B8", backgroundColor: "#F8FAFC" },
              }}
            >
              Reset Filters
            </Button>
          </Box>
        </Paper>
      ) : viewMode !== "table" ? (
        /* ================= BOX VIEW ================= */
        <Box>
          {paginatedLeads.map((lead) => {
            const statusStyle = getStatusColor(lead.status);
            const priorityStyle = getPriorityColor(lead.priority);
            const isOverdue =
              lead.next_follow_up_date &&
              new Date(lead.next_follow_up_date).setHours(0, 0, 0, 0) <
                new Date().setHours(0, 0, 0, 0) &&
              !["Won", "Lost", "Not Interested"].includes(lead.status);
            const isToday =
              lead.next_follow_up_date &&
              new Date(lead.next_follow_up_date).setHours(0, 0, 0, 0) ===
                new Date().setHours(0, 0, 0, 0);

            return (
              <Card
                key={lead.id}
                elevation={0}
                sx={{
                  mb: 2,
                  borderRadius: "14px",
                  border: `1px solid ${isOverdue ? "#FCA5A5" : COLORS.border}`,
                  borderLeft: `5px solid ${isOverdue ? "#EF4444" : isToday ? "#22C55E" : COLORS.accent}`,
                  backgroundColor: "#FFFFFF",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(11, 58, 99, 0.08)",
                    borderColor: isOverdue ? "#EF4444" : "#94A3B8",
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2.2 } }}>
                  {/* Top Bar: Lead ID + Client Name + Quick Actions */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 1.2,
                      borderBottom: `1px solid ${COLORS.border}`,
                      pb: 1.4,
                      mb: 1.8,
                    }}
                  >
                    <Stack direction="row" spacing={1.2} sx={{ alignItems: "center" }}>
                      <Chip
                        label={lead.lead_code || `LD${lead.id}`}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.76rem",
                          letterSpacing: "0.03em",
                          backgroundColor: "#EFF6FF",
                          color: "#1D4ED8",
                          border: "1px solid #BFDBFE",
                          borderRadius: "6px",
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 800,
                          fontSize: "1.05rem",
                          color: COLORS.textPrimary,
                        }}
                      >
                        {lead.customer_name}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      {lead.mobile_number && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PhoneOutlinedIcon />}
                          href={`tel:${lead.mobile_number}`}
                          sx={{
                            color: COLORS.primary,
                            borderColor: COLORS.border,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            borderRadius: "6px",
                            textTransform: "none",
                            px: 1.2,
                            "&:hover": { borderColor: COLORS.accent, backgroundColor: "#F0F9FF" },
                          }}
                        >
                          CALL
                        </Button>
                      )}

                      {lead.mobile_number && (
                        <Tooltip title="Chat on WhatsApp">
                          <IconButton
                            size="small"
                            component="a"
                            href={`https://wa.me/91${lead.mobile_number.replace(/\D/g, "").slice(-10)}`}
                            target="_blank"
                            sx={{
                              border: "1px solid #BBF7D0",
                              backgroundColor: "#F0FDF4",
                              color: "#22C55E",
                              borderRadius: "6px",
                              p: 0.6,
                              "&:hover": { backgroundColor: "#DCFCE7" },
                            }}
                          >
                            <WhatsAppIcon sx={{ fontSize: "1.2rem" }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Reschedule Follow-up">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenReschedule(lead)}
                          sx={{
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "6px",
                            p: 0.6,
                            "&:hover": { backgroundColor: "#F8FAFC" },
                          }}
                        >
                          <EventRepeatRoundedIcon sx={{ fontSize: "1.2rem", color: COLORS.accent }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>

                  {/* Middle Info 3-Columns Structured Boxes */}
                  <Grid container spacing={2} sx={{ mb: 1.8 }}>
                    {/* Box 1: Pipeline & Assignment */}
                    <Grid xs={12} sm={4}>
                      <Box
                        sx={{
                          backgroundColor: "#F8FAFC",
                          borderRadius: "10px",
                          p: 1.5,
                          border: "1px solid #F1F5F9",
                          height: "100%",
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: "#64748B",
                            fontSize: "0.68rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            mb: 0.2,
                            display: "block",
                          }}
                        >
                          Pipeline & Assignment
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                            Status:
                          </Typography>
                          <Chip
                            label={lead.status}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              backgroundColor: statusStyle.bg,
                              color: statusStyle.color,
                              border: `1px solid ${statusStyle.border}`,
                              borderRadius: "4px",
                            }}
                          />
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                            Source:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: "0.82rem" }}>
                            {lead.lead_source || "Website / Organic"}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                            Assigned To:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.accent, fontSize: "0.82rem" }}>
                            {lead.assigned_to_name || "Unassigned"}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Box 2: Contact & Location */}
                    <Grid xs={12} sm={4}>
                      <Box
                        sx={{
                          backgroundColor: "#F8FAFC",
                          borderRadius: "10px",
                          p: 1.5,
                          border: "1px solid #F1F5F9",
                          height: "100%",
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            color: "#64748B",
                            fontSize: "0.68rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            mb: 0.2,
                            display: "block",
                          }}
                        >
                          Customer & Location
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                            Created:
                          </Typography>
                          <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontSize: "0.82rem" }}>
                            {formatDate(lead.created_at)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                            Phone:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.82rem" }}>
                            {lead.mobile_number || "N/A"}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                            Location:
                          </Typography>
                          <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontSize: "0.82rem" }}>
                            {[lead.city, lead.state].filter(Boolean).join(", ") || "Rajasthan"}
                          </Typography>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                            Priority:
                          </Typography>
                          <Chip
                            label={lead.priority || "Medium"}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              backgroundColor: priorityStyle.bg,
                              color: priorityStyle.color,
                              borderRadius: "4px",
                            }}
                          />
                        </Box>
                      </Box>
                    </Grid>

                    {/* Box 3: Solar Requirement & Follow-up */}
                    <Grid xs={12} sm={4}>
                      <Box
                        sx={{
                          backgroundColor: "#F8FAFC",
                          borderRadius: "10px",
                          p: 1.5,
                          border: "1px solid #F1F5F9",
                          height: "100%",
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.8,
                          justifyContent: "space-between",
                        }}
                      >
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: "#64748B",
                              fontSize: "0.68rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              display: "block",
                            }}
                          >
                            Requirement & Follow-up
                          </Typography>

                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                              Capacity:
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.82rem" }}>
                              {lead.system_capacity || "5.0"} kW ({lead.requirement_type || "Solar"})
                            </Typography>
                          </Box>

                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                              Survey Date:
                            </Typography>
                            <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontSize: "0.82rem" }}>
                              {lead.survey_date ? formatDate(lead.survey_date) : "Pending"}
                            </Typography>
                          </Box>
                        </Box>

                        {/* NEXT FOLLOW-UP DATE CALLOUT BOX */}
                        <Box
                          sx={{
                            mt: 0.8,
                            p: 1.1,
                            px: 1.4,
                            borderRadius: "8px",
                            backgroundColor: isOverdue ? "#FEF2F2" : isToday ? "#F0FDF4" : "#F0F9FF",
                            border: `1px solid ${isOverdue ? "#FECACA" : isToday ? "#BBF7D0" : "#BAE6FD"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "0.66rem",
                                fontWeight: 800,
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                color: isOverdue ? "#DC2626" : isToday ? "#166534" : "#0369A1",
                                display: "block",
                              }}
                            >
                              {isOverdue ? "Overdue Follow-up" : isToday ? "Follow-up Today" : "Next Follow-up"}
                            </Typography>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 900,
                                fontSize: "0.92rem",
                                color: isOverdue ? "#991B1B" : isToday ? "#15803D" : "#0B3A63",
                                mt: 0.1,
                              }}
                            >
                              {lead.next_follow_up_date ? formatDate(lead.next_follow_up_date) : "Not Scheduled"}
                            </Typography>
                          </Box>
                          {isOverdue && (
                            <Chip
                              label="Action Req"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.64rem",
                                fontWeight: 800,
                                backgroundColor: "#EF4444",
                                color: "#FFFFFF",
                                borderRadius: "4px",
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Bottom: Remarks Section & Inline Remark Input */}
                  <Box
                    sx={{
                      backgroundColor: "#F8FAFC",
                      borderRadius: "8px",
                      p: 1.5,
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                        mb: 0.8,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.78rem" }}>
                          Remark:
                        </Typography>
                        <Chip
                          label="Latest"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.64rem",
                            fontWeight: 700,
                            backgroundColor: "#DCFCE7",
                            color: "#166534",
                            borderRadius: "4px",
                          }}
                        />
                        {lead.latest_remark_date && (
                          <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.72rem" }}>
                            {formatDateTime(lead.latest_remark_date || lead.updated_at || lead.created_at)}
                          </Typography>
                        )}
                      </Stack>

                      {(lead.total_remarks > 0 || lead.remark) && (
                        <Button
                          size="small"
                          startIcon={<HistoryRoundedIcon />}
                          onClick={() => handleOpenHistory(lead)}
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: COLORS.accent,
                            textTransform: "none",
                            p: 0,
                            minWidth: 0,
                            "&:hover": { textDecoration: "underline", backgroundColor: "transparent" },
                          }}
                        >
                          Read more {lead.total_remarks ? `(${lead.total_remarks} remarks)` : "(History)"}
                        </Button>
                      )}
                    </Box>

                    {/* Latest Remark Note */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: lead.latest_remark ? COLORS.textPrimary : COLORS.textSecondary,
                        fontStyle: lead.latest_remark ? "normal" : "italic",
                        fontSize: "0.82rem",
                        mb: 1.2,
                      }}
                    >
                      {lead.latest_remark ? `"${lead.latest_remark}"` : "No remarks added yet."}
                    </Typography>

                    {/* Inline Add Remark Input */}
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="+ Add remark (Enter to save)"
                      value={inlineRemarks[lead.id] || ""}
                      onChange={(e) =>
                        setInlineRemarks((prev) => ({ ...prev, [lead.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleInlineRemarkSubmit(lead.id);
                        }
                      }}
                      slotProps={{ input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => handleInlineRemarkSubmit(lead.id)}
                              disabled={savingRemarkLeadId === lead.id || !(inlineRemarks[lead.id] || "").trim()}
                              sx={{
                                color: COLORS.accent,
                                "&:hover": { backgroundColor: "rgba(0, 91, 172, 0.08)" },
                              }}
                            >
                              {savingRemarkLeadId === lead.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <SendRoundedIcon sx={{ fontSize: "1.1rem" }} />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}}
                      sx={{
                        "& .MuiInputBase-root": {
                          backgroundColor: "#FFFFFF",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          height: 36,
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        /* ================= TABLE VIEW ================= */
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: "#FFFFFF",
            mb: 2,
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#F1F5F9",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#CBD5E1",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "#94A3B8",
              },
            },
          }}
        >
          <Table size="small" sx={{ minWidth: 1100, width: "100%" }}>
            <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", color: COLORS.primary, width: "14%", whiteSpace: "nowrap" }}>LEAD</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", color: COLORS.primary, width: "14%", whiteSpace: "nowrap" }}>CONTACT</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", color: COLORS.primary, width: "12%", whiteSpace: "nowrap" }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", color: COLORS.primary, width: "14%", whiteSpace: "nowrap" }}>ASSIGNED</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", color: COLORS.primary, width: "12%", whiteSpace: "nowrap" }}>NEXT FOLLOW-UP</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem", color: COLORS.primary, width: "24%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>LATEST REMARK</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.78rem", color: COLORS.primary, width: "10%", whiteSpace: "nowrap" }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedLeads.map((lead) => {
                const statusStyle = getStatusColor(lead.status);
                const isOverdue =
                  lead.next_follow_up_date &&
                  new Date(lead.next_follow_up_date).setHours(0, 0, 0, 0) <
                    new Date().setHours(0, 0, 0, 0) &&
                  !["Won", "Lost", "Not Interested"].includes(lead.status);

                return (
                  <TableRow key={lead.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                        {lead.customer_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.accent, fontWeight: 700 }}>
                        {lead.lead_code || `LD${lead.id}`}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: "0.8rem", color: COLORS.textPrimary }}>
                        {lead.mobile_number}
                      </Typography>
                      <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
                        {lead.city || "Rajasthan"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={lead.status}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          borderRadius: "4px",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        {lead.assigned_to_name || "Unassigned"}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.82rem",
                          color: isOverdue ? "#DC2626" : "#15803D",
                        }}
                      >
                        {lead.next_follow_up_date ? formatDate(lead.next_follow_up_date) : "Not Set"}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{
                          display: "block",
                          color: lead.latest_remark ? COLORS.textPrimary : COLORS.textSecondary,
                        }}
                      >
                        {lead.latest_remark || "—"}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.6} justifyContent="flex-end">
                        {lead.mobile_number && (
                          <IconButton
                            size="small"
                            href={`tel:${lead.mobile_number}`}
                            sx={{ color: COLORS.primary, p: 0.5 }}
                          >
                            <PhoneOutlinedIcon sx={{ fontSize: "1.1rem" }} />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleOpenReschedule(lead)}
                          sx={{ color: COLORS.accent, p: 0.5 }}
                        >
                          <EventRepeatRoundedIcon sx={{ fontSize: "1.1rem" }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenHistory(lead)}
                          sx={{ color: COLORS.textSecondary, p: 0.5 }}
                        >
                          <HistoryRoundedIcon sx={{ fontSize: "1.1rem" }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 6. PAGINATION */}
      {leads.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: "#FFFFFF",
          }}
        >
          <TablePagination
            component="div"
            count={leads.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 12, 25, 50]}
          />
        </Paper>
      )}

      {/* 7. REMARKS TIMELINE HISTORY MODAL */}
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: COLORS.primary }}>
              Follow-up History & Remarks
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textSecondary }}>
              {activeLeadForHistory?.customer_name} ({activeLeadForHistory?.lead_code})
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setHistoryModalOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          {historyLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} sx={{ color: COLORS.accent }} />
            </Box>
          ) : historyRemarks.length === 0 ? (
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, textAlign: "center", py: 3 }}>
              No previous follow-up records found.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {historyRemarks.map((item, idx) => (
                <Box
                  key={item.id || idx}
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Chip
                      label={item.followup_type || "Call"}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        backgroundColor: "#E0F2FE",
                        color: "#0369A1",
                      }}
                    />
                    <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                      {formatDateTime(item.created_at)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: COLORS.textPrimary, fontWeight: 500, mt: 0.5 }}>
                    {item.note}
                  </Typography>
                  {item.created_by_name && (
                    <Typography variant="caption" sx={{ color: COLORS.accent, fontWeight: 700, mt: 0.5, display: "block" }}>
                      By: {item.created_by_name}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setHistoryModalOpen(false)} sx={{ fontWeight: 600, color: COLORS.textSecondary }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 8. RESCHEDULE FOLLOW-UP MODAL */}
      <Dialog
        open={rescheduleModalOpen}
        onClose={() => !rescheduleSubmitting && setRescheduleModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: COLORS.primary, pb: 1 }}>
          Reschedule Follow-up
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mb: 2 }}>
            Set a new next follow-up date and optional note for{" "}
            <strong>{activeLeadForReschedule?.customer_name}</strong>.
          </Typography>

          <TextField
            fullWidth
            type="date"
            label="Next Follow-up Date"
            value={newFollowupDate}
            onChange={(e) => setNewFollowupDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Follow-up Note / Reason"
            placeholder="e.g. Customer asked to call back next Monday..."
            value={newFollowupNote}
            onChange={(e) => setNewFollowupNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 1.5 }}>
          <Button
            onClick={() => setRescheduleModalOpen(false)}
            disabled={rescheduleSubmitting}
            sx={{ fontWeight: 600, color: COLORS.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleSaveReschedule}
            disabled={rescheduleSubmitting || !newFollowupDate}
            sx={{
              backgroundColor: COLORS.primary,
              "&:hover": { backgroundColor: COLORS.primaryHover },
              fontWeight: 700,
            }}
          >
            {rescheduleSubmitting ? <CircularProgress size={20} color="inherit" /> : "Save Follow-up"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 9. SNACKBAR NOTIFICATION */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

