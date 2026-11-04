import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Avatar,
  Stack,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  Collapse,
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterListOff as ClearFilterIcon,
  Phone as PhoneIcon,
  EventBusy as ClosedIcon,
  WarningAmberRounded as WarningIcon,
  ThumbDownAltRounded as NotInterestedIcon,
  TrendingDownRounded as LostIcon,
  CategoryRounded as CategoryIcon,
  ExpandMoreRounded as ExpandMoreIcon,
  ExpandLessRounded as ExpandLessIcon,
  ContentCopyRounded as CopyIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { getClosedLeadsReport } from "../services/leadService";
import { getUsers } from "../services/userServices";

const COLORS = {
  primary: "#00B5EF",
  primaryDark: "#292075",
  primarySoft: "#E0F7FF",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  slate: "#475569",
};

const REASON_CATEGORIES = [
  "All Categories",
  "Price issue",
  "Already installed",
  "Not interested in solar",
  "Competitor selected",
  "No response",
  "Other",
];

const formatDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getInitials = (n = "") => {
  if (!n) return "?";
  return n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
};

export default function ClosedLeadsReport({ isManagerView = false }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [reps, setReps] = useState([]);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedRep, setSelectedRep] = useState("");
  const [reasonCategory, setReasonCategory] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Expanded row state for 50-word descriptions
  const [expandedRows, setExpandedRows] = useState({});

  // Fetch sales reps for filter dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getUsers({ limit: 200 });
        const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
        // Filter reps and managers
        const salesUsers = list.filter(
          (u) =>
            u.role_name === "Sales" ||
            u.role?.name === "Sales" ||
            Number(u.role_id) === 3
        );
        setReps(salesUsers);
      } catch (err) {
        console.error("Error fetching reps list for report filter:", err);
      }
    };
    fetchUsers();
  }, []);

  // Fetch Report Data from backend
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;
      if (selectedRep) filters.assigned_to = selectedRep;
      if (reasonCategory && reasonCategory !== "All Categories") {
        filters.reason_category = reasonCategory;
      }
      if (statusFilter && statusFilter !== "all") {
        filters.status = statusFilter;
      }

      const res = await getClosedLeadsReport(filters);
      setData(res?.data || []);
      setPage(0);
    } catch (err) {
      console.error("Error fetching closed leads report:", err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, selectedRep, reasonCategory, statusFilter]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Client-side quick search filtering
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();
    return data.filter(
      (r) =>
        r.lead_code?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.mobile_number?.includes(q) ||
        r.assigned_to_name?.toLowerCase().includes(q) ||
        r.reason_category?.toLowerCase().includes(q) ||
        r.remark?.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  // Summary Metrics
  const summary = useMemo(() => {
    const total = filteredData.length;
    const notInterested = filteredData.filter((r) => r.status === "Not Interested").length;
    const lost = filteredData.filter((r) => r.status === "Lost").length;

    // Reason frequency
    const reasonMap = {};
    filteredData.forEach((r) => {
      const cat = r.reason_category || "Unspecified";
      reasonMap[cat] = (reasonMap[cat] || 0) + 1;
    });

    let topReason = "None";
    let topReasonCount = 0;
    Object.entries(reasonMap).forEach(([cat, cnt]) => {
      if (cnt > topReasonCount) {
        topReason = cat;
        topReasonCount = cnt;
      }
    });

    return { total, notInterested, lost, topReason, topReasonCount };
  }, [filteredData]);

  // Quick Preset Date Ranges
  const applyPreset = (preset) => {
    const now = new Date();
    if (preset === "all") {
      setFromDate("");
      setToDate("");
    } else if (preset === "today") {
      const todayStr = now.toISOString().slice(0, 10);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const todayStr = now.toISOString().slice(0, 10);
      setFromDate(firstDay);
      setToDate(todayStr);
    } else if (preset === "last_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
        .toISOString()
        .slice(0, 10);
      setFromDate(firstDay);
      setToDate(lastDay);
    }
  };

  const handleResetFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedRep("");
    setReasonCategory("All Categories");
    setStatusFilter("all");
    setSearchQuery("");
  };

  const toggleRowExpanded = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 1-Click CSV Export
  const handleExportCSV = () => {
    if (!filteredData.length) return;

    const headers = [
      "Lead Code",
      "Customer Name",
      "Phone",
      "Email",
      "City",
      "State",
      "Assigned Sales Rep",
      "Status",
      "Reason Category",
      "Reason Details (50-word Description)",
      "Closed Date",
    ];

    const rows = filteredData.map((r) => [
      `"${r.lead_code || ""}"`,
      `"${(r.customer_name || "").replace(/"/g, '""')}"`,
      `"${r.mobile_number || ""}"`,
      `"${r.email || ""}"`,
      `"${r.city || ""}"`,
      `"${r.state || ""}"`,
      `"${(r.assigned_to_name || "Unassigned").replace(/"/g, '""')}"`,
      `"${r.status || ""}"`,
      `"${r.reason_category || "N/A"}"`,
      `"${(r.remark || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
      `"${formatDate(r.closed_date)}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Not_Interested_And_Lost_Leads_Report_${dateStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  return (
    <Box sx={{ width: "100%", py: 1 }}>
      {/* 1. REPORT HEADER & KPIS */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            bgcolor: COLORS.card,
            display: "flex",
            alignItems: "center",
            gap: 1.8,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              bgcolor: "#F1F5F9",
              color: COLORS.slate,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ClosedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
              Total Closed Leads
            </Typography>
            <Typography sx={{ fontSize: "1.3rem", fontWeight: 900, color: COLORS.textPrimary }}>
              {summary.total}
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            bgcolor: COLORS.card,
            display: "flex",
            alignItems: "center",
            gap: 1.8,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              bgcolor: COLORS.dangerSoft,
              color: COLORS.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <NotInterestedIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
              Not Interested
            </Typography>
            <Typography sx={{ fontSize: "1.3rem", fontWeight: 900, color: COLORS.danger }}>
              {summary.notInterested}
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            bgcolor: COLORS.card,
            display: "flex",
            alignItems: "center",
            gap: 1.8,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              bgcolor: COLORS.warningSoft,
              color: COLORS.warning,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LostIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
              Lost Deals
            </Typography>
            <Typography sx={{ fontSize: "1.3rem", fontWeight: 900, color: COLORS.warning }}>
              {summary.lost}
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            bgcolor: COLORS.card,
            display: "flex",
            alignItems: "center",
            gap: 1.8,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              bgcolor: COLORS.primarySoft,
              color: COLORS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CategoryIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
              Top Drop-off Reason
            </Typography>
            <Typography
              sx={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: COLORS.primaryDark,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {summary.topReason}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* 2. FILTER CONTROLS BAR */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          bgcolor: COLORS.card,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
          {/* Quick Date Presets */}
          <Stack direction="row" spacing={0.8} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            <Button
              size="small"
              variant={!fromDate && !toDate ? "contained" : "outlined"}
              onClick={() => applyPreset("all")}
              sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: "8px", py: 0.4 }}
            >
              All Time
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => applyPreset("today")}
              sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: "8px", py: 0.4 }}
            >
              Today
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => applyPreset("this_month")}
              sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: "8px", py: 0.4 }}
            >
              This Month
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => applyPreset("last_month")}
              sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: "8px", py: 0.4 }}
            >
              Last Month
            </Button>
          </Stack>

          <Box sx={{ flex: 1 }} />

          {/* Single-Click CSV Export Button */}
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            sx={{
              backgroundColor: COLORS.primary,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8125rem",
              borderRadius: "10px",
              px: 2,
              py: 0.8,
              boxShadow: "0 2px 8px rgba(0,181,239,0.25)",
              "&:hover": { backgroundColor: COLORS.primaryDark },
            }}
          >
            Export CSV ({filteredData.length})
          </Button>

          <Tooltip title="Refresh Report">
            <span>
              <IconButton
                onClick={fetchReport}
                disabled={loading}
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "10px",
                  p: 0.9,
                }}
              >
                <RefreshIcon
                  sx={{
                    fontSize: 18,
                    animation: loading ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Detailed Filter Inputs */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }, gap: 1.5 }}>
          {/* From Date */}
          <TextField
            size="small"
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#FAFBFC" } }}
          />

          {/* To Date */}
          <TextField
            size="small"
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#FAFBFC" } }}
          />

          {/* Sales Rep Filter */}
          <FormControl size="small">
            <InputLabel id="rep-filter-label">Sales Rep</InputLabel>
            <Select
              labelId="rep-filter-label"
              label="Sales Rep"
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              sx={{ borderRadius: "10px", bgcolor: "#FAFBFC" }}
            >
              <MenuItem value="">All Sales Reps</MenuItem>
              {reps.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.full_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Reason Category Filter */}
          <FormControl size="small">
            <InputLabel id="category-filter-label">Reason Category</InputLabel>
            <Select
              labelId="category-filter-label"
              label="Reason Category"
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              sx={{ borderRadius: "10px", bgcolor: "#FAFBFC" }}
            >
              {REASON_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status Filter */}
          <FormControl size="small">
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ borderRadius: "10px", bgcolor: "#FAFBFC" }}
            >
              <MenuItem value="all">All Closed Leads</MenuItem>
              <MenuItem value="Not Interested">Not Interested</MenuItem>
              <MenuItem value="Lost">Lost</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Quick Search & Clear */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Search by lead code, customer name, phone, rep or remark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: COLORS.textMuted }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#FAFBFC" } }}
          />

          {(fromDate || toDate || selectedRep || reasonCategory !== "All Categories" || statusFilter !== "all" || searchQuery) && (
            <Button
              size="small"
              variant="text"
              startIcon={<ClearFilterIcon />}
              onClick={handleResetFilters}
              sx={{ textTransform: "none", color: COLORS.danger, fontWeight: 700, fontSize: "0.8rem" }}
            >
              Reset Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* 3. REPORT DATA TABLE */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px",
          border: `1px solid ${COLORS.border}`,
          overflow: "hidden",
          bgcolor: COLORS.card,
        }}
      >
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ "& th": { bgcolor: "#FAFBFC", fontWeight: 800, color: COLORS.primaryDark, fontSize: "0.75rem", py: 1.5, borderBottom: `2px solid ${COLORS.border}` } }}>
                <TableCell>Lead Code</TableCell>
                <TableCell>Customer Details</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Assigned Rep</TableCell>
                <TableCell>Status & Category</TableCell>
                <TableCell sx={{ minWidth: 260 }}>50-Word Reason / Remarks</TableCell>
                <TableCell align="right">Closed Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 8 }}>
                    <CircularProgress size={32} sx={{ color: COLORS.primary, mb: 1.5 }} />
                    <Typography sx={{ color: COLORS.textMuted, fontSize: "0.85rem" }}>
                      Fetching closed leads audit records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 8 }}>
                    <ClosedIcon sx={{ fontSize: 42, color: COLORS.textMuted, mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                      No Closed Leads Found
                    </Typography>
                    <Typography sx={{ color: COLORS.textMuted, fontSize: "0.8125rem", mt: 0.5 }}>
                      No leads match the specified date range, sales rep, or reason category filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row) => {
                  const isExpanded = Boolean(expandedRows[row.id]);
                  const wordCount = row.remark
                    ? row.remark.trim().split(/\s+/).filter(Boolean).length
                    : 0;

                  return (
                    <TableRow key={row.id} hover sx={{ "&:hover": { bgcolor: "#F8FAFC" } }}>
                      {/* Lead Code */}
                      <TableCell sx={{ verticalAlign: "top", py: 1.5 }}>
                        <Chip
                          label={row.lead_code || `LD-${row.id}`}
                          size="small"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            bgcolor: COLORS.primarySoft,
                            color: COLORS.primaryDark,
                            borderRadius: "6px",
                          }}
                        />
                      </TableCell>

                      {/* Customer Name */}
                      <TableCell sx={{ verticalAlign: "top", py: 1.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: COLORS.textPrimary }}>
                          {row.customer_name}
                        </Typography>
                        {(row.city || row.state) && (
                          <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                            {[row.city, row.state].filter(Boolean).join(", ")}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Phone */}
                      <TableCell sx={{ verticalAlign: "top", py: 1.5 }}>
                        <Stack direction="row" spacing={0.6} alignItems="center">
                          <PhoneIcon sx={{ fontSize: 14, color: COLORS.primary }} />
                          <Typography
                            component="a"
                            href={`tel:${row.mobile_number}`}
                            sx={{
                              fontSize: "0.8125rem",
                              color: COLORS.textPrimary,
                              fontWeight: 600,
                              textDecoration: "none",
                              "&:hover": { color: COLORS.primary },
                            }}
                          >
                            {row.mobile_number}
                          </Typography>
                        </Stack>
                        {row.email && (
                          <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, mt: 0.2 }}>
                            {row.email}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Assigned Rep */}
                      <TableCell sx={{ verticalAlign: "top", py: 1.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              bgcolor: COLORS.primaryDark,
                              color: "#FFF",
                            }}
                          >
                            {getInitials(row.assigned_to_name)}
                          </Avatar>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: COLORS.textPrimary }}>
                            {row.assigned_to_name || "Unassigned"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Status & Reason Category */}
                      <TableCell sx={{ verticalAlign: "top", py: 1.5 }}>
                        <Stack spacing={0.6} alignItems="flex-start">
                          <Chip
                            label={row.status}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              bgcolor: row.status === "Not Interested" ? COLORS.dangerSoft : COLORS.warningSoft,
                              color: row.status === "Not Interested" ? COLORS.danger : COLORS.warning,
                              borderRadius: "6px",
                            }}
                          />
                          {row.reason_category && (
                            <Chip
                              label={row.reason_category}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                borderColor: "#CBD5E1",
                                color: COLORS.textSecondary,
                                borderRadius: "6px",
                              }}
                            />
                          )}
                        </Stack>
                      </TableCell>

                      {/* 50-word Reason / Remarks */}
                      <TableCell sx={{ verticalAlign: "top", py: 1.5 }}>
                        <Box sx={{ maxWidth: 380 }}>
                          <Box
                            sx={{
                              p: 1.2,
                              borderRadius: "8px",
                              bgcolor: "#F8FAFC",
                              border: `1px solid ${COLORS.border}`,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: "0.8rem",
                                color: COLORS.textPrimary,
                                lineHeight: 1.5,
                                fontStyle: "italic",
                                display: !isExpanded && wordCount > 25 ? "-webkit-box" : "block",
                                WebkitLineClamp: !isExpanded && wordCount > 25 ? 3 : "unset",
                                WebkitBoxOrient: "vertical",
                                overflow: !isExpanded && wordCount > 25 ? "hidden" : "visible",
                              }}
                            >
                              "{row.remark || "No explanation provided."}"
                            </Typography>

                            {wordCount > 25 && (
                              <Button
                                size="small"
                                onClick={() => toggleRowExpanded(row.id)}
                                endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                sx={{
                                  textTransform: "none",
                                  p: 0,
                                  minWidth: "auto",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  color: COLORS.primary,
                                  mt: 0.5,
                                }}
                              >
                                {isExpanded ? "Show Less" : "Show Full Description"}
                              </Button>
                            )}

                            <Stack direction="row" spacing={1} sx={{ mt: 0.6 }} alignItems="center">
                              <Typography sx={{ fontSize: "0.68rem", color: COLORS.textMuted }}>
                                {wordCount} words
                              </Typography>
                              {wordCount >= 50 && (
                                <Chip
                                  label="50-word validation passed"
                                  size="small"
                                  sx={{
                                    height: 16,
                                    fontSize: "0.62rem",
                                    bgcolor: COLORS.successSoft,
                                    color: COLORS.success,
                                    fontWeight: 700,
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Closed Date */}
                      <TableCell align="right" sx={{ verticalAlign: "top", py: 1.5 }}>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: COLORS.textPrimary }}>
                          {formatDate(row.closed_date)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            borderTop: `1px solid ${COLORS.border}`,
            "& .MuiTablePagination-toolbar": { minHeight: 44, px: 2 },
            "& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel": {
              fontSize: "0.78rem",
              color: COLORS.textSecondary,
              fontWeight: 600,
            },
          }}
        />
      </Paper>
    </Box>
  );
}
