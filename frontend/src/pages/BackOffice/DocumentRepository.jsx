// ============================================================================
// CLIENT DOCUMENT REPOSITORY & KYC VAULT
// Ultra-modern executive UI matching Leads & Today's Follow-up standards
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
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
  Chip,
  Button,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Card,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Avatar,
  Select,
  MenuItem,
  Breadcrumbs,
} from "@mui/material";

import {
  FolderSharedRounded as FolderIcon,
  Search as SearchIcon,
  RefreshRounded as RefreshIcon,
  VisibilityRounded as ViewIcon,
  DownloadRounded as DownloadIcon,
  DescriptionRounded as DocIcon,
  BadgeRounded as AadhaarIcon,
  ReceiptLongRounded as BillIcon,
  AccountBalanceRounded as ChequeIcon,
  CreditCardRounded as PanIcon,
  HomeWorkRounded as PropertyIcon,
  PhotoCameraRounded as PhotoIcon,
  Close as CloseIcon,
  OpenInNewRounded as OpenNewIcon,
  FilterListRounded as FilterIcon,
  ExpandMoreRounded as ExpandMoreIcon,
  UnfoldMoreRounded as ExpandAllIcon,
  UnfoldLessRounded as CollapseAllIcon,
  TableRowsOutlined as TableRowsOutlinedIcon,
  ViewAgendaOutlined as ViewAgendaOutlinedIcon,
  PhoneRounded as PhoneIcon,
  LocationOnRounded as LocationIcon,
  HomeOutlined as HomeOutlinedIcon,
  NavigateNextRounded as NavigateNextRoundedIcon,
  DateRangeRounded as DateRangeIcon,
  RestartAltRounded as ResetIcon,
  CheckCircleRounded as CheckCircleIcon,
  PictureAsPdfRounded as PdfIcon,
  ImageRounded as ImageIcon,
} from "@mui/icons-material";

import { getAllProjectDocuments } from "../../services/projectFileService";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:5000";

// Exact design tokens from Leads & Today's Follow-up
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

// Document category badges & icons
const getDocTypeBadge = (type) => {
  switch (type) {
    case "Aadhaar Card":
      return { color: "#005BAC", bg: "#EFF6FF", icon: <AadhaarIcon sx={{ fontSize: 16 }} /> };
    case "Electricity Bill":
      return { color: "#D97706", bg: "#FEF3C7", icon: <BillIcon sx={{ fontSize: 16 }} /> };
    case "Cancelled Cheque":
      return { color: "#16A34A", bg: "#DCFCE7", icon: <ChequeIcon sx={{ fontSize: 16 }} /> };
    case "PAN Card":
      return { color: "#7C3AED", bg: "#F3E8FF", icon: <PanIcon sx={{ fontSize: 16 }} /> };
    case "Property Document":
      return { color: "#EA580C", bg: "#FFEDD5", icon: <PropertyIcon sx={{ fontSize: 16 }} /> };
    case "Meter Application Photo":
    case "Site Photo":
      return { color: "#0284C7", bg: "#E0F2FE", icon: <PhotoIcon sx={{ fontSize: 16 }} /> };
    default:
      return { color: "#64748B", bg: "#F1F5F9", icon: <DocIcon sx={{ fontSize: 16 }} /> };
  }
};

export default function DocumentRepository() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // "all", "today", "7days", "30days", "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // View Mode: "boxes" (Client Folders) or "table" (Flat List)
  const [viewMode, setViewMode] = useState("boxes");

  // Expanded client box states
  const [expandedClients, setExpandedClients] = useState({});

  // Pagination for Flat Table
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Inline Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getAllProjectDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load project documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Type filter
      if (selectedType !== "all" && doc.doc_type !== selectedType) {
        return false;
      }

      // 2. Date filter
      if (doc.created_at) {
        const docDate = new Date(doc.created_at);
        const now = new Date();

        if (dateFilter === "today") {
          const isToday =
            docDate.getDate() === now.getDate() &&
            docDate.getMonth() === now.getMonth() &&
            docDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateFilter === "7days") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (docDate < sevenDaysAgo) return false;
        } else if (dateFilter === "30days") {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (docDate < thirtyDaysAgo) return false;
        } else if (dateFilter === "custom") {
          if (startDate && docDate < new Date(startDate)) return false;
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (docDate > end) return false;
          }
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFile = doc.file_number?.toLowerCase().includes(q);
        const matchName = doc.customer_name?.toLowerCase().includes(q);
        const matchPhone = doc.phone_number?.includes(q);
        const matchAen = doc.aen_office?.toLowerCase().includes(q);
        const matchFileOrig = doc.original_filename?.toLowerCase().includes(q);
        const matchType = doc.doc_type?.toLowerCase().includes(q);
        return matchFile || matchName || matchPhone || matchAen || matchFileOrig || matchType;
      }

      return true;
    });
  }, [documents, selectedType, dateFilter, startDate, endDate, searchQuery]);

  // Group filtered documents by Client / File
  const clientGroups = useMemo(() => {
    const groups = {};
    filteredDocs.forEach((doc) => {
      const key = doc.file_id || doc.file_number;
      if (!groups[key]) {
        groups[key] = {
          file_id: doc.file_id,
          file_number: doc.file_number,
          customer_name: doc.customer_name,
          phone_number: doc.phone_number,
          aen_office: doc.aen_office,
          current_stage: doc.current_stage,
          file_status: doc.file_status,
          documents: [],
        };
      }
      groups[key].documents.push(doc);
    });
    return Object.values(groups);
  }, [filteredDocs]);

  // Auto-expand first client box on initial load
  useEffect(() => {
    if (clientGroups.length > 0 && Object.keys(expandedClients).length === 0) {
      setExpandedClients({ [clientGroups[0].file_id || clientGroups[0].file_number]: true });
    }
  }, [clientGroups]);

  const handleToggleExpand = (key) => {
    setExpandedClients((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExpandAll = () => {
    const all = {};
    clientGroups.forEach((c) => {
      all[c.file_id || c.file_number] = true;
    });
    setExpandedClients(all);
  };

  const handleCollapseAll = () => {
    setExpandedClients({});
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setDateFilter("all");
    setStartDate("");
    setEndDate("");
  };

  // Counts for KPIs
  const kpis = useMemo(() => {
    const total = documents.length;
    const aadhaar = documents.filter((d) => d.doc_type === "Aadhaar Card").length;
    const bills = documents.filter((d) => d.doc_type === "Electricity Bill").length;
    const cheques = documents.filter((d) => d.doc_type === "Cancelled Cheque").length;
    const pans = documents.filter((d) => d.doc_type === "PAN Card").length;
    const property = documents.filter((d) => d.doc_type === "Property Document").length;
    const photos = documents.filter(
      (d) => d.doc_type === "Meter Application Photo" || d.doc_type === "Site Photo"
    ).length;
    return { total, aadhaar, bills, cheques, pans, property, photos };
  }, [documents]);

  const getFullUrl = (relativeUrl) => {
    if (!relativeUrl) return "";
    if (relativeUrl.startsWith("http")) return relativeUrl;
    return `${API_BASE_URL}${relativeUrl.startsWith("/") ? "" : "/"}${relativeUrl}`;
  };

  const handleDownload = (doc) => {
    const url = getFullUrl(doc.file_url);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.original_filename || `${doc.doc_type}_${doc.file_number}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedType !== "all" ||
    dateFilter !== "all" ||
    startDate !== "" ||
    endDate !== "";

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
          Document Repository & KYC Vault
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
              Client Document Repository
            </Typography>
            <Chip
              label={`${documents.length} Total Files`}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.72rem",
                fontWeight: 700,
                backgroundColor: COLORS.primarySoft,
                color: COLORS.accent,
                border: "1px solid #BAE6FD",
                borderRadius: "10px",
              }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{ color: COLORS.textSecondary, mt: 0.4, fontSize: "0.82rem" }}
          >
            Client-wise expandable folders for Aadhaar, electricity bills, cancelled cheques, PAN, property deeds & meter photos.
          </Typography>
        </Box>

        {/* Action Controls Toolbar (Segmented Toggle & Refresh) */}
        <Stack direction="row" spacing={1.2} alignItems="center">
          {/* Segmented View Mode Toggle matching Leads / Today's Follow-up */}
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
              { mode: "boxes", label: "Client Folders", icon: <ViewAgendaOutlinedIcon sx={{ fontSize: "1.05rem" }} /> },
              { mode: "table", label: "Flat Table", icon: <TableRowsOutlinedIcon sx={{ fontSize: "1.05rem" }} /> },
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

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon sx={{ fontSize: "16px !important" }} />}
            onClick={fetchDocs}
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

      {/* 4. TOP 5 EXECUTIVE METRIC CARDS (ALL 5 IN ONE ROW SIDE-BY-SIDE) */}
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
        {/* Card 1: Total Documents */}
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
                Total Vault Files
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
                {kpis.total} Docs
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
              <FolderIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted, mt: 1.5, fontWeight: 500 }}>
            Across all active customer projects
          </Typography>
        </Card>

        {/* Card 2: Aadhaar Identity */}
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
                Aadhaar Cards
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
                {kpis.aadhaar} Files
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
              <AadhaarIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.accent, mt: 1.5, fontWeight: 600 }}>
            Customer KYC identity proof
          </Typography>
        </Card>

        {/* Card 3: Electricity Bills */}
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
                DISCOM Bills
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
                {kpis.bills} Files
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
              <BillIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.warning, mt: 1.5, fontWeight: 600 }}>
            Consumer utility san verification
          </Typography>
        </Card>

        {/* Card 4: Cancelled Cheques */}
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
                Bank Cheques (DBT)
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
                {kpis.cheques} Files
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
              <ChequeIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted, mt: 1.5, fontWeight: 500 }}>
            Direct benefit subsidy clearance
          </Typography>
        </Card>

        {/* Card 5: PAN & Property Documents */}
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
                PAN & Property
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
                {kpis.pans + kpis.property} Files
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
              <PropertyIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.purple, mt: 1.5, fontWeight: 600 }}>
            Roof rights & financial sanction
          </Typography>
        </Card>
      </Box>

      {/* 5. ADVANCED SEARCH & MULTI-FILTER BAR (MATCHING LEADS PAGE) */}
      <Paper
        elevation={0}
        sx={{
          p: 2.2,
          mb: 3,
          borderRadius: "12px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
        }}
      >
        <Stack spacing={2}>
          {/* Top Row: Search + Date Filter Presets + Reset Button */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search by Client Name, Phone, File No, AEN Office, Filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: "1 1 340px",
                maxWidth: { xs: "100%", md: 480 },
                "& .MuiOutlinedInput-root": {
                  height: 38,
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
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            {/* Date Range Selector */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <DateRangeIcon sx={{ fontSize: 18, color: COLORS.textSecondary }} />
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary }}>
                  Date:
                </Typography>
                <Select
                  size="small"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  sx={{
                    height: 38,
                    fontSize: "0.8125rem",
                    minWidth: 140,
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Uploaded Today</MenuItem>
                  <MenuItem value="7days">Last 7 Days</MenuItem>
                  <MenuItem value="30days">Last 30 Days</MenuItem>
                  <MenuItem value="custom">Custom Range...</MenuItem>
                </Select>
              </Box>

              {/* Custom Date Pickers if selected */}
              {dateFilter === "custom" && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: 38,
                        fontSize: "0.75rem",
                        borderRadius: "8px",
                      },
                    }}
                  />
                  <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted }}>to</Typography>
                  <TextField
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        height: 38,
                        fontSize: "0.75rem",
                        borderRadius: "8px",
                      },
                    }}
                  />
                </Stack>
              )}

              {/* Reset Filters Button */}
              {isFiltered && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ResetIcon sx={{ fontSize: "15px !important" }} />}
                  onClick={handleResetFilters}
                  sx={{
                    height: 38,
                    px: 1.5,
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    borderRadius: "8px",
                    textTransform: "none",
                    borderColor: COLORS.border,
                    color: COLORS.textSecondary,
                    "&:hover": { borderColor: COLORS.danger, color: COLORS.danger },
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          </Box>

          {/* Bottom Row: Document Category Chips */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", pt: 0.5 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mr: 0.5 }}>
              Category:
            </Typography>
            {[
              { key: "all", label: `All (${documents.length})` },
              { key: "Aadhaar Card", label: `Aadhaar (${kpis.aadhaar})` },
              { key: "Electricity Bill", label: `Bills (${kpis.bills})` },
              { key: "Cancelled Cheque", label: `Cheques (${kpis.cheques})` },
              { key: "PAN Card", label: `PAN (${kpis.pans})` },
              { key: "Property Document", label: `Property (${kpis.property})` },
              { key: "Meter Application Photo", label: `Meter Photos (${kpis.photos})` },
            ].map((fItem) => {
              const isSel = selectedType === fItem.key;
              return (
                <Chip
                  key={fItem.key}
                  label={fItem.label}
                  size="small"
                  onClick={() => setSelectedType(fItem.key)}
                  sx={{
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: isSel ? 700 : 500,
                    height: 28,
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
        </Stack>
      </Paper>

      {/* 6. EXPAND / COLLAPSE CONTROLS FOR CLIENT FOLDERS VIEW */}
      {viewMode === "boxes" && clientGroups.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            px: 0.5,
          }}
        >
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.primary }}>
            Showing {clientGroups.length} Customer Vaults ({filteredDocs.length} Documents)
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="text"
              startIcon={<ExpandAllIcon sx={{ fontSize: "16px !important" }} />}
              onClick={handleExpandAll}
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                color: COLORS.accent,
                textTransform: "none",
                "&:hover": { backgroundColor: COLORS.primarySoft },
              }}
            >
              Expand All
            </Button>
            <Button
              size="small"
              variant="text"
              startIcon={<CollapseAllIcon sx={{ fontSize: "16px !important" }} />}
              onClick={handleCollapseAll}
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                color: COLORS.textSecondary,
                textTransform: "none",
                "&:hover": { backgroundColor: "#F1F5F9" },
              }}
            >
              Collapse All
            </Button>
          </Stack>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* 7. VIEW MODE 1: CLIENT ACCORDION FOLDERS                                  */}
      {/* ========================================================================= */}
      {viewMode === "boxes" && (
        <Box>
          {loading ? (
            <Paper
              elevation={0}
              sx={{ p: 6, textAlign: "center", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}
            >
              <CircularProgress size={36} sx={{ color: COLORS.accent }} />
              <Typography sx={{ mt: 1.5, fontSize: "0.85rem", color: COLORS.textSecondary, fontWeight: 500 }}>
                Loading client document vaults...
              </Typography>
            </Paper>
          ) : clientGroups.length === 0 ? (
            <Paper
              elevation={0}
              sx={{ p: 6, textAlign: "center", borderRadius: "12px", border: `1px solid ${COLORS.border}`, bgcolor: "#FFFFFF" }}
            >
              <FolderIcon sx={{ fontSize: 44, color: COLORS.textMuted, mb: 1 }} />
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: COLORS.primary }}>
                No customer vaults found matching your filters.
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: COLORS.textSecondary, mt: 0.5 }}>
                Try modifying your search terms, date range, or category filter.
              </Typography>
              {isFiltered && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleResetFilters}
                  sx={{ mt: 2, textTransform: "none", borderRadius: "8px", fontWeight: 600 }}
                >
                  Clear All Filters
                </Button>
              )}
            </Paper>
          ) : (
            clientGroups.map((client) => {
              const clientKey = client.file_id || client.file_number;
              const isExpanded = Boolean(expandedClients[clientKey]);
              const docCount = client.documents.length;

              return (
                <Card
                  key={clientKey}
                  elevation={0}
                  sx={{
                    mb: 2,
                    borderRadius: "12px",
                    border: isExpanded ? `1.5px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                    backgroundColor: COLORS.card,
                    overflow: "hidden",
                    transition: "all 0.18s ease-in-out",
                    boxShadow: isExpanded ? "0 4px 16px rgba(0, 91, 172, 0.08)" : "0 1px 3px rgba(15,23,42,0.03)",
                  }}
                >
                  {/* Client Folder Header */}
                  <Box
                    onClick={() => handleToggleExpand(clientKey)}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      backgroundColor: isExpanded ? "#F0F9FF" : "#FFFFFF",
                      borderBottom: isExpanded ? "1px solid #BAE6FD" : "none",
                      transition: "background-color 0.15s ease",
                      "&:hover": { backgroundColor: isExpanded ? "#F0F9FF" : "#F8FAFC" },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        alignItems: { xs: "flex-start", sm: "center" },
                        gap: 1.5,
                      }}
                    >
                      {/* Client Info */}
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          sx={{
                            bgcolor: isExpanded ? COLORS.accent : COLORS.primary,
                            width: 42,
                            height: 42,
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            borderRadius: "10px",
                          }}
                        >
                          {client.customer_name?.charAt(0)?.toUpperCase() || "C"}
                        </Avatar>
                        <Box>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.primary }}>
                              {client.customer_name}
                            </Typography>
                            <Chip
                              size="small"
                              label={client.file_number}
                              sx={{
                                fontWeight: 800,
                                bgcolor: COLORS.primarySoft,
                                color: COLORS.accent,
                                fontSize: "0.72rem",
                                height: 22,
                                borderRadius: "6px",
                              }}
                            />
                            <Chip
                              size="small"
                              label={
                                client.file_status === "Completed"
                                  ? "Stage 18: Completed"
                                  : `Stage ${client.current_stage || 1}`
                              }
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                height: 22,
                                borderRadius: "6px",
                                backgroundColor: client.file_status === "Completed" ? COLORS.successSoft : "#F1F5F9",
                                color: client.file_status === "Completed" ? COLORS.success : COLORS.textSecondary,
                              }}
                            />
                          </Stack>
                          <Stack direction="row" spacing={2} sx={{ mt: 0.4 }} alignItems="center" flexWrap="wrap">
                            <Typography
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: COLORS.textSecondary,
                                fontWeight: 500,
                                fontSize: "0.75rem",
                              }}
                            >
                              <PhoneIcon sx={{ fontSize: 13, color: COLORS.success }} /> {client.phone_number || "No Phone"}
                            </Typography>
                            <Typography
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: COLORS.textSecondary,
                                fontWeight: 500,
                                fontSize: "0.75rem",
                              }}
                            >
                              <LocationIcon sx={{ fontSize: 13, color: "#EA580C" }} /> {client.aen_office || "AEN Office"}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>

                      {/* Right Stats & Expand Icon */}
                      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}>
                        <Chip
                          icon={<DocIcon sx={{ fontSize: "14px !important" }} />}
                          label={`${docCount} Documents`}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            height: 26,
                            borderRadius: "8px",
                            bgcolor: isExpanded ? COLORS.accent : "#F1F5F9",
                            color: isExpanded ? "#FFFFFF" : COLORS.textPrimary,
                            "& .MuiChip-icon": { color: isExpanded ? "#FFFFFF" : COLORS.accent },
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            width: 30,
                            height: 30,
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease-in-out",
                            bgcolor: isExpanded ? "#BAE6FD" : "#F1F5F9",
                          }}
                        >
                          <ExpandMoreIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  </Box>

                  {/* Expanded Documents Table */}
                  {isExpanded && (
                    <Box sx={{ p: 2, backgroundColor: "#FFFFFF" }}>
                      <TableContainer
                        sx={{
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "8px",
                          overflowX: "auto",
                        }}
                      >
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.2 }}>
                                DOCUMENT CATEGORY
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.2 }}>
                                ORIGINAL FILENAME
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.2 }}>
                                UPLOADED DATE & TIME
                              </TableCell>
                              <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.2, textAlign: "right" }}>
                                ACTIONS
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {client.documents.map((doc) => {
                              const badge = getDocTypeBadge(doc.doc_type);
                              const isPdf = doc.file_url?.toLowerCase().endsWith(".pdf");

                              return (
                                <TableRow key={doc.id} hover>
                                  <TableCell sx={{ py: 1.2 }}>
                                    <Chip
                                      size="small"
                                      icon={badge.icon}
                                      label={doc.doc_type}
                                      sx={{
                                        bgcolor: badge.bg,
                                        color: badge.color,
                                        fontWeight: 700,
                                        fontSize: "0.72rem",
                                        height: 24,
                                        borderRadius: "6px",
                                        border: `1px solid ${badge.color}30`,
                                      }}
                                    />
                                  </TableCell>

                                  <TableCell sx={{ py: 1.2 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      {isPdf ? (
                                        <PdfIcon sx={{ fontSize: 18, color: COLORS.danger }} />
                                      ) : (
                                        <ImageIcon sx={{ fontSize: 18, color: COLORS.accent }} />
                                      )}
                                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: COLORS.textPrimary }}>
                                        {doc.original_filename || "Document File"}
                                      </Typography>
                                    </Box>
                                  </TableCell>

                                  <TableCell sx={{ py: 1.2 }}>
                                    <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                                      {doc.created_at
                                        ? new Date(doc.created_at).toLocaleString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : "-"}
                                    </Typography>
                                  </TableCell>

                                  <TableCell sx={{ py: 1.2, textAlign: "right" }}>
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ViewIcon sx={{ fontSize: "14px !important" }} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPreviewDoc(doc);
                                        }}
                                        sx={{
                                          height: 28,
                                          fontSize: "0.72rem",
                                          fontWeight: 600,
                                          borderRadius: "6px",
                                          textTransform: "none",
                                          borderColor: COLORS.border,
                                          color: COLORS.accent,
                                          backgroundColor: "#FFFFFF",
                                          "&:hover": {
                                            backgroundColor: COLORS.primarySoft,
                                            borderColor: COLORS.accent,
                                          },
                                        }}
                                      >
                                        View
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<DownloadIcon sx={{ fontSize: "14px !important" }} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownload(doc);
                                        }}
                                        sx={{
                                          height: 28,
                                          fontSize: "0.72rem",
                                          fontWeight: 600,
                                          borderRadius: "6px",
                                          textTransform: "none",
                                          backgroundColor: COLORS.accent,
                                          "&:hover": { backgroundColor: COLORS.primary },
                                        }}
                                      >
                                        Download
                                      </Button>
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Card>
              );
            })
          )}
        </Box>
      )}

      {/* ========================================================================= */}
      {/* 8. VIEW MODE 2: FLAT TABLE VIEW                                           */}
      {/* ========================================================================= */}
      {viewMode === "table" && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                    CLIENT & FILE DETAILS
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                    AEN OFFICE & STAGE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                    DOCUMENT CATEGORY
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                    FILENAME
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                    UPLOADED DATE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4, textAlign: "right" }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={36} sx={{ color: COLORS.accent }} />
                    </TableCell>
                  </TableRow>
                ) : filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: COLORS.primary }}>
                        No documents found matching your filter criteria.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((doc) => {
                      const badge = getDocTypeBadge(doc.doc_type);
                      const isPdf = doc.file_url?.toLowerCase().endsWith(".pdf");

                      return (
                        <TableRow key={doc.id} hover>
                          {/* Client Details */}
                          <TableCell sx={{ py: 1.2 }}>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: COLORS.primary }}>
                              {doc.file_number}
                            </Typography>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: COLORS.textPrimary }}>
                              {doc.customer_name}
                            </Typography>
                            <Typography
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                fontSize: "0.72rem",
                                color: COLORS.textSecondary,
                                mt: 0.3,
                              }}
                            >
                              <PhoneIcon sx={{ fontSize: 12, color: COLORS.success }} /> {doc.phone_number || "-"}
                            </Typography>
                          </TableCell>

                          {/* AEN Office & Stage */}
                          <TableCell sx={{ py: 1.2 }}>
                            <Typography sx={{ fontSize: "0.8rem", color: COLORS.textPrimary, fontWeight: 500 }}>
                              {doc.aen_office || "-"}
                            </Typography>
                            <Chip
                              size="small"
                              label={
                                doc.file_status === "Completed"
                                  ? "Stage 18: Completed"
                                  : `Stage ${doc.current_stage || 1}`
                              }
                              sx={{
                                fontSize: "0.68rem",
                                height: 20,
                                mt: 0.5,
                                borderRadius: "4px",
                                backgroundColor: doc.file_status === "Completed" ? COLORS.successSoft : "#F1F5F9",
                                color: doc.file_status === "Completed" ? COLORS.success : COLORS.textSecondary,
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>

                          {/* Category Badge */}
                          <TableCell sx={{ py: 1.2 }}>
                            <Chip
                              size="small"
                              icon={badge.icon}
                              label={doc.doc_type}
                              sx={{
                                bgcolor: badge.bg,
                                color: badge.color,
                                fontWeight: 700,
                                fontSize: "0.72rem",
                                height: 24,
                                borderRadius: "6px",
                                border: `1px solid ${badge.color}30`,
                              }}
                            />
                          </TableCell>

                          {/* Filename */}
                          <TableCell sx={{ py: 1.2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              {isPdf ? (
                                <PdfIcon sx={{ fontSize: 18, color: COLORS.danger }} />
                              ) : (
                                <ImageIcon sx={{ fontSize: 18, color: COLORS.accent }} />
                              )}
                              <Typography
                                sx={{
                                  fontSize: "0.8rem",
                                  fontWeight: 500,
                                  maxWidth: 240,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  color: COLORS.textPrimary,
                                }}
                              >
                                {doc.original_filename || "Document File"}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Uploaded Date */}
                          <TableCell sx={{ py: 1.2 }}>
                            <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary }}>
                              {doc.created_at
                                ? new Date(doc.created_at).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </Typography>
                          </TableCell>

                          {/* Action Buttons */}
                          <TableCell sx={{ py: 1.2, textAlign: "right" }}>
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ViewIcon sx={{ fontSize: "14px !important" }} />}
                                onClick={() => setPreviewDoc(doc)}
                                sx={{
                                  height: 28,
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  borderRadius: "6px",
                                  textTransform: "none",
                                  borderColor: COLORS.border,
                                  color: COLORS.accent,
                                  backgroundColor: "#FFFFFF",
                                  "&:hover": {
                                    backgroundColor: COLORS.primarySoft,
                                    borderColor: COLORS.accent,
                                  },
                                }}
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<DownloadIcon sx={{ fontSize: "14px !important" }} />}
                                onClick={() => handleDownload(doc)}
                                sx={{
                                  height: 28,
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  borderRadius: "6px",
                                  textTransform: "none",
                                  backgroundColor: COLORS.accent,
                                  "&:hover": { backgroundColor: COLORS.primary },
                                }}
                              >
                                Download
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination for Table View */}
          <Box sx={{ p: 1.5, display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${COLORS.border}` }}>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredDocs.length}
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
        </Paper>
      )}

      {/* 9. INLINE PREVIEW MODAL */}
      <Dialog
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.primary }}>
              {previewDoc?.doc_type} • {previewDoc?.file_number}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.2 }}>
              Customer: {previewDoc?.customer_name} ({previewDoc?.phone_number}) • {previewDoc?.original_filename}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setPreviewDoc(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: 2.5,
            textAlign: "center",
            backgroundColor: "#F8FAFC",
            minHeight: 380,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {previewDoc ? (
            previewDoc.file_url?.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={getFullUrl(previewDoc.file_url)}
                title="Document Preview"
                width="100%"
                height="520px"
                style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}
              />
            ) : (
              <Box
                component="img"
                src={getFullUrl(previewDoc.file_url)}
                alt={previewDoc.original_filename}
                sx={{
                  maxWidth: "100%",
                  maxHeight: 520,
                  objectFit: "contain",
                  borderRadius: "8px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                }}
              />
            )
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "space-between", borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            startIcon={<OpenNewIcon sx={{ fontSize: "15px !important" }} />}
            component="a"
            href={previewDoc ? getFullUrl(previewDoc.file_url) : "#"}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8rem",
              color: COLORS.accent,
            }}
          >
            Open in Full Screen Tab
          </Button>
          <Stack direction="row" spacing={1.2}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon sx={{ fontSize: "15px !important" }} />}
              onClick={() => previewDoc && handleDownload(previewDoc)}
              size="small"
              sx={{
                height: 34,
                px: 2,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                backgroundColor: COLORS.accent,
                "&:hover": { backgroundColor: COLORS.primary },
              }}
            >
              Download
            </Button>
            <Button
              variant="outlined"
              onClick={() => setPreviewDoc(null)}
              size="small"
              sx={{
                height: 34,
                px: 2,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                borderColor: COLORS.border,
                color: COLORS.textSecondary,
              }}
            >
              Close
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
