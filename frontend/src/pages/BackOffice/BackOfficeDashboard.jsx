// ============================================================================
// BACK-OFFICE TASK QUEUE & MASTER OPERATIONS WORKSPACE
// Unified, 100% consistent UI across all 17 stages matching Leads standards
// ============================================================================

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Tabs,
  Tab,
  Breadcrumbs,
  Divider,
} from "@mui/material";

// Icons (Zero Unicode Emojis)
import {
  SpeedRounded as SpeedIcon,
  SearchRounded as SearchIcon,
  RefreshRounded as RefreshIcon,
  FolderSharedRounded as FolderIcon,
  VisibilityRounded as ViewIcon,
  AccountTreeRounded as FunnelIcon,
  CheckCircleOutlineRounded as SubmitIcon,
  PauseCircleOutlineRounded as HoldIcon,
  CancelOutlined as CancelIcon,
  CheckCircleRounded as CheckCircleIcon,
  WarningAmberRounded as WarningIcon,
  ScheduleRounded as TimerIcon,
  AccountBalanceWalletRounded as PaymentIcon,
  LanguageRounded as OnlineIcon,
  HomeWorkRounded as FieldIcon,
  AssignmentTurnedInRounded as TaskIcon,
  HomeOutlined as HomeOutlinedIcon,
  NavigateNextRounded as NavigateNextRoundedIcon,
  OpenInNewRounded as OpenInNewIcon,
  PhoneRounded as PhoneIcon,
  LocationOnRounded as LocationIcon,
  Close as CloseIcon,
  HistoryRounded as HistoryIcon,
  VerifiedRounded as VerifiedIcon,
  EngineeringRounded as InstallIcon,
  MonetizationOnRounded as PaidIcon,
  ReceiptLongRounded as ReceiptIcon,
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";
import {
  getMyQueue,
  performStageAction,
  getFileDetail,
  addProjectPayment,
  verifyProjectPayment,
  togglePaymentClear,
} from "../../services/projectFileService";

import AdminRateApprovalGate from "../../components/BackOffice/AdminRateApprovalGate";
import RemarkValidationModal from "../../components/BackOffice/RemarkValidationModal";

// Persona Dedicated Desks
import AccountsLedgerDesk from "./AccountsLedgerDesk";
import BackOfficeOnlineDesk from "./BackOfficeOnlineDesk";
import LoanOfficerDesk from "./LoanOfficerDesk";
import BackOfficeFieldDesk from "./BackOfficeFieldDesk";
import InstallationLeadDesk from "./InstallationLeadDesk";
import PortalEntryDesk from "./PortalEntryDesk";

// Design tokens exactly matching Leads & Today's Follow-up
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

// All 18 Stages Metadata (0 to 17)
const STAGES_METADATA = [
  { stage: 0, name: "Modification Sub-Branch", desk: "Back Office Online", deskKey: "online", color: "#005BAC" },
  { stage: 1, name: "File Online", desk: "Back Office Online", deskKey: "online", color: "#005BAC" },
  { stage: 2, name: "Loan 1st Check (Bank Submission)", desk: "Loan Officer", deskKey: "loan", color: "#2563EB" },
  { stage: 3, name: "Offline File", desk: "Back Office Field", deskKey: "field", color: "#EA580C" },
  { stage: 4, name: "Meter Application Photo", desk: "Back Office Field", deskKey: "field", color: "#EA580C" },
  { stage: 5, name: "Pre-Install Payment Check", desk: "Accounts", deskKey: "accounts", color: "#16A34A" },
  { stage: 6, name: "Installation Work", desk: "Installation Lead", deskKey: "installation", color: "#D97706" },
  { stage: 7, name: "Post-Install Payment Check", desk: "Accounts", deskKey: "accounts", color: "#16A34A" },
  { stage: 8, name: "Online Installation Details", desk: "Portal Entry", deskKey: "portal", color: "#7C3AED" },
  { stage: 9, name: "Work Completion at AEN Office", desk: "Back Office Field", deskKey: "field", color: "#EA580C" },
  { stage: 10, name: "Loan 2nd Check (Disbursement Docs)", desk: "Loan Officer", deskKey: "loan", color: "#2563EB" },
  { stage: 11, name: "Meter Installed", desk: "Back Office Field", deskKey: "field", color: "#EA580C" },
  { stage: 12, name: "Plant Start", desk: "Back Office Field", deskKey: "field", color: "#EA580C" },
  { stage: 13, name: "WiFi Connected", desk: "Back Office Field", deskKey: "field", color: "#EA580C" },
  { stage: 14, name: "Customer Explanation", desk: "Back Office Field", deskKey: "field", color: "#EA580C" },
  { stage: 15, name: "Payment Check-up & Ledger Verification", desk: "Accounts", deskKey: "accounts", color: "#16A34A" },
  { stage: 16, name: "Final Closing", desk: "Super Admin", deskKey: "master", color: "#0B3A63" },
  { stage: 17, name: "Subsidy Redeemed", desk: "Portal Entry", deskKey: "portal", color: "#7C3AED" },
];

export default function BackOfficeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rawRole = (user?.role_name || user?.role || "").trim();
  const isAdmin = rawRole.toLowerCase().includes("admin") || rawRole.toLowerCase().includes("super");
  const [selectedDesk, setSelectedDesk] = useState("all");

  // Desk Tab Filter: "all", "online", "loan", "field", "accounts", "installation", "portal"
  const [activeDeskTab, setActiveDeskTab] = useState("all");

  // Workflow State Tab: "all", "pending", "completed", "hold", "cancelled"
  const [workflowStatusTab, setWorkflowStatusTab] = useState("all");

  // Queue Data
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters for Unified Stage Table
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("all");
  const [selectedSla, setSelectedSla] = useState("all");

  // Pagination for Unified Table
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // File Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailFileId, setDetailFileId] = useState(null);
  const [fileDetailData, setFileDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Remark Validation Modal for Hold / Cancel
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [selectedFileForAction, setSelectedFileForAction] = useState(null);
  const [pendingActionType, setPendingActionType] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Add Payment Modal (Stage 5 / Stage 7)
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [paymentTargetFile, setPaymentTargetFile] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_stage: "Pre-Install",
    amount: "",
    payment_mode: "Cash",
    reference_number: "",
    bank_name: "",
    cheque_date: "",
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getMyQueue();
      setFiles(res.files || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to load operations task queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Top KPI Metrics
  const totalFiles = files.length;
  const pendingFiles = files.filter((f) => f.file_status === "Active" || f.stage_status === "Pending");
  const overdueFiles = files.filter((f) => f.sla_color === "red" || (f.hours_remaining !== undefined && f.hours_remaining <= 0));
  const holdFiles = files.filter((f) => f.file_status === "On Hold" || f.stage_status === "Hold");
  const completedFiles = files.filter((f) => f.file_status === "Completed" || f.current_stage >= 17);

  // Filtered Files across Desk, Workflow Status, Stage, SLA, and Search Query
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const currentStageNum = Number(f.current_stage);

      // 1. Desk Tab Filter
      if (activeDeskTab !== "all") {
        if (activeDeskTab === "online" && currentStageNum !== 0 && currentStageNum !== 1) return false;
        if (activeDeskTab === "loan" && currentStageNum !== 2 && currentStageNum !== 10) return false;
        if (activeDeskTab === "field" && ![3, 4, 9, 11, 12, 13, 14].includes(currentStageNum)) return false;
        if (activeDeskTab === "accounts" && ![5, 7, 15].includes(currentStageNum)) return false;
        if (activeDeskTab === "installation" && currentStageNum !== 6) return false;
        if (activeDeskTab === "portal" && currentStageNum !== 8 && currentStageNum !== 17) return false;
      }

      // 2. Specific Stage Filter Dropdown
      if (selectedStage !== "all" && currentStageNum !== Number(selectedStage)) {
        return false;
      }

      // 3. Workflow Status Tab
      if (workflowStatusTab === "pending") {
        if (f.file_status === "On Hold" || f.file_status === "Completed" || f.file_status === "Cancelled") return false;
      } else if (workflowStatusTab === "completed") {
        if (f.file_status !== "Completed" && currentStageNum < 17) return false;
      } else if (workflowStatusTab === "hold") {
        if (f.file_status !== "On Hold" && f.stage_status !== "Hold") return false;
      } else if (workflowStatusTab === "cancelled") {
        if (f.file_status !== "Cancelled") return false;
      }

      // 4. SLA Filter
      if (selectedSla === "overdue" && f.sla_color !== "red") return false;
      if (selectedSla === "safe" && f.sla_color === "red") return false;

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFile = f.file_number?.toLowerCase().includes(q);
        const matchName = f.customer_name?.toLowerCase().includes(q);
        const matchPhone = f.phone_number?.includes(q);
        const matchAen = f.aen_office?.toLowerCase().includes(q);
        const matchStage = f.stage_name?.toLowerCase().includes(q);
        return matchFile || matchName || matchPhone || matchAen || matchStage;
      }

      return true;
    });
  }, [files, activeDeskTab, selectedStage, workflowStatusTab, selectedSla, searchQuery]);

  // Open File Detail Modal
  const handleOpenFileDetail = async (fileId) => {
    setDetailFileId(fileId);
    setDetailModalOpen(true);
    try {
      setDetailLoading(true);
      const res = await getFileDetail(fileId);
      setFileDetailData(res);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to load file details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Quick Stage Forward / Submit / Pass
  const handleQuickAction = (file, action) => {
    setSelectedFileForAction(file);
    setPendingActionType(action);
    if (action === "Hold" || action === "Cancel") {
      setRemarkModalOpen(true);
    } else {
      executeQuickAction(file, action);
    }
  };

  const executeQuickAction = async (file, action, remarks = "") => {
    try {
      setActionLoading(true);
      await performStageAction(file.id, {
        stage_number: file.current_stage,
        action,
        remarks,
      });
      setRemarkModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Stage action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemarkSubmit = (remarksText) => {
    if (!selectedFileForAction || !pendingActionType) return;
    executeQuickAction(selectedFileForAction, pendingActionType, remarksText);
  };

  // Open Add Payment Modal
  const handleOpenAddPayment = (file) => {
    setPaymentTargetFile(file);
    setPaymentForm({
      payment_stage: file.current_stage === 5 ? "Pre-Install" : "Post-Install",
      amount: "",
      payment_mode: "Cash",
      reference_number: "",
      bank_name: "",
      cheque_date: "",
    });
    setAddPaymentOpen(true);
  };

  const handleAddPaymentSubmit = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert("Please enter a valid amount!");
      return;
    }
    try {
      setPaymentSubmitting(true);
      await addProjectPayment(paymentTargetFile.id, paymentForm);
      alert("Payment recorded successfully!");
      setAddPaymentOpen(false);
      loadData();
      if (detailModalOpen && detailFileId === paymentTargetFile.id) {
        handleOpenFileDetail(paymentTargetFile.id);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record payment");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    try {
      await verifyProjectPayment(paymentId);
      alert("Payment verified and locked in ledger!");
      if (detailFileId) handleOpenFileDetail(detailFileId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify payment");
    }
  };

  const handleToggleClear = async (paymentId) => {
    try {
      await togglePaymentClear(paymentId);
      if (detailFileId) handleOpenFileDetail(detailFileId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle clearance");
    }
  };

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
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: COLORS.textSecondary }}>
            Dashboard
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: COLORS.textSecondary }}>
          Project Execution
        </Typography>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.primary }}>
          Back-Office Operations & 17 Stages
        </Typography>
      </Breadcrumbs>

      {/* 2. TOP HERO HEADER (Exact 1:1 match with clean Leads standard) */}
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
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: COLORS.primary,
                letterSpacing: -0.3,
                fontSize: { xs: "1.25rem", md: "1.45rem" },
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              Back-Office Operations Hub
            </Typography>
            <Chip
              label={`${files.length} Orders in Lifecycle`}
              size="small"
              sx={{
                height: 24,
                fontSize: "0.72rem",
                fontWeight: 700,
                backgroundColor: COLORS.primarySoft,
                color: COLORS.accent,
                border: "1px solid #BAE6FD",
                borderRadius: "10px",
                whiteSpace: "nowrap",
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.5, fontSize: "0.82rem" }}>
            Uniform stage operations management across all 17 workflow steps with standardized actions.
          </Typography>
        </Box>

        {/* Action Controls Toolbar (Matching Image 1 perfectly) */}
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SpeedIcon sx={{ fontSize: "16px !important" }} />}
            onClick={() => navigate("/back-office/analytics")}
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
              whiteSpace: "nowrap",
              "&:hover": { backgroundColor: "#F1F5F9", borderColor: COLORS.borderStrong },
            }}
          >
            Analytics & Radar
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FolderIcon sx={{ fontSize: "16px !important" }} />}
            onClick={() => navigate("/documents")}
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
              whiteSpace: "nowrap",
              "&:hover": { backgroundColor: "#F1F5F9", borderColor: COLORS.borderStrong },
            }}
          >
            Document Vault
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<RefreshIcon sx={{ fontSize: "16px !important" }} />}
            onClick={loadData}
            sx={{
              height: 36,
              px: 2,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.8125rem",
              backgroundColor: COLORS.accent,
              boxShadow: "0 2px 8px rgba(0, 91, 172, 0.25)",
              whiteSpace: "nowrap",
              "&:hover": { backgroundColor: COLORS.primary },
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* 2B. SUPER ADMIN & ADMIN VIEWING DESK SELECTOR BAR */}
      {isAdmin && (
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            px: 2,
            mb: 2.5,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "8px",
                bgcolor: COLORS.primarySoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.accent,
              }}
            >
              <InstallIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.primary, lineHeight: 1.2 }}>
                Viewing Desk Switcher
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                Switch view between Master 17-Stage Hub and individual departmental desks
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary, whiteSpace: "nowrap", display: { xs: "none", sm: "block" } }}>
              Viewing Desk:
            </Typography>
            <Select
              size="small"
              value={selectedDesk}
              onChange={(e) => setSelectedDesk(e.target.value)}
              sx={{
                height: 36,
                minWidth: { xs: 240, sm: 330 },
                bgcolor: "#F8FAFC",
                borderRadius: "8px",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: COLORS.primary,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.borderStrong },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.accent },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.accent, borderWidth: 1.5 },
              }}
            >
              <MenuItem value="all" sx={{ fontSize: "0.8125rem", fontWeight: 700, color: COLORS.primary }}>
                Master Operations Hub (All 17 Stages)
              </MenuItem>
              <MenuItem value="online" sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                Online Desk — Discom Online & Modification (S0, S1)
              </MenuItem>
              <MenuItem value="loan" sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                Loan Desk — Bank Loan & Disbursement (S2, S10)
              </MenuItem>
              <MenuItem value="field" sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                Field Desk — Offline AEN & Commissioning (S3, S4, S9, S11-14)
              </MenuItem>
              <MenuItem value="accounts" sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                Accounts Desk — Dual Ledger Clearance (S5, S7, S15)
              </MenuItem>
              <MenuItem value="installation" sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                Installation Desk — Solar Mounting & Plant (S6)
              </MenuItem>
              <MenuItem value="portal" sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                Portal Entry — National Portal & Subsidy (S8, S17)
              </MenuItem>
            </Select>
          </Stack>
        </Paper>
      )}

      {/* 3. ERROR ALERT */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px", border: "1px solid #FECACA", fontSize: "0.82rem" }}>
          {errorMsg}
        </Alert>
      )}

      {/* 3. DEDICATED DESK ROUTER OR MASTER OPERATIONS VIEW */}
      {selectedDesk === "online" ? (
        <BackOfficeOnlineDesk />
      ) : selectedDesk === "loan" ? (
        <LoanOfficerDesk />
      ) : selectedDesk === "field" ? (
        <BackOfficeFieldDesk />
      ) : selectedDesk === "accounts" ? (
        <AccountsLedgerDesk />
      ) : selectedDesk === "installation" ? (
        <InstallationLeadDesk />
      ) : selectedDesk === "portal" ? (
        <PortalEntryDesk />
      ) : (
        <>
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
        {/* Card 1: Total Queue */}
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
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                Total Queue
              </Typography>
              <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: COLORS.primary, mt: 0.6 }}>
                {totalFiles} Orders
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: COLORS.primarySoft, color: COLORS.accent, width: 38, height: 38, borderRadius: "10px" }}>
              <TaskIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textMuted, mt: 1.5, fontWeight: 500 }}>
            Files in 17 lifecycle stages
          </Typography>
        </Card>

        {/* Card 2: Awaiting Action */}
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
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                Awaiting Action
              </Typography>
              <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: COLORS.accent, mt: 0.6 }}>
                {pendingFiles.length} Tasks
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: "#EFF6FF", color: COLORS.accent, width: 38, height: 38, borderRadius: "10px" }}>
              <TimerIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.accent, mt: 1.5, fontWeight: 600 }}>
            Pending desk verification
          </Typography>
        </Card>

        {/* Card 3: Critical SLA Overdue */}
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
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                SLA Overdue
              </Typography>
              <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: COLORS.danger, mt: 0.6 }}>
                {overdueFiles.length} Escalated
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: COLORS.dangerSoft, color: COLORS.danger, width: 38, height: 38, borderRadius: "10px" }}>
              <WarningIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.danger, mt: 1.5, fontWeight: 600 }}>
            Exceeded standard deadline
          </Typography>
        </Card>

        {/* Card 4: Held Bottlenecks */}
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
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                Held Inquiries
              </Typography>
              <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: COLORS.warning, mt: 0.6 }}>
                {holdFiles.length} Files
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: COLORS.warningSoft, color: COLORS.warning, width: 38, height: 38, borderRadius: "10px" }}>
              <HoldIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.warning, mt: 1.5, fontWeight: 600 }}>
            Blocked with logged remarks
          </Typography>
        </Card>

        {/* Card 5: Completed Files */}
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
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase" }}>
                Completed & Closed
              </Typography>
              <Typography sx={{ fontSize: "1.35rem", fontWeight: 800, color: COLORS.success, mt: 0.6 }}>
                {completedFiles.length} Orders
              </Typography>
            </Box>
            <Avatar sx={{ bgcolor: COLORS.successSoft, color: COLORS.success, width: 38, height: 38, borderRadius: "10px" }}>
              <CheckCircleIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.success, mt: 1.5, fontWeight: 600 }}>
            Stage 17 subsidy redeemed
          </Typography>
        </Card>
      </Box>

      {/* 5. SUPER ADMIN RATE APPROVAL GATE */}
      {isAdmin && (
        <Box sx={{ mb: 3 }}>
          <AdminRateApprovalGate />
        </Box>
      )}

      {/* 6. UNIFIED STAGE OPERATIONS WORKSPACE (EXACT LEADS THEME) */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.card,
          overflow: "hidden",
          mb: 3,
          boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
        }}
      >
        {/* DESK SELECTOR TABS BAR WITH PURE CSS UNDERLINE */}
        <Box
          sx={{
            px: 2,
            pt: 0.5,
            borderBottom: "2px solid #E2E8F0",
            backgroundColor: "#FFFFFF",
            overflowX: "auto",
          }}
        >
          <Tabs
            value={activeDeskTab}
            onChange={(_, val) => {
              setActiveDeskTab(val);
              setSelectedStage("all");
              setPage(0);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 46,
              mb: "-2px",
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                minHeight: 46,
                fontWeight: 600,
                fontSize: "0.82rem",
                textTransform: "none",
                fontFamily: "'Inter', sans-serif",
                color: COLORS.textSecondary,
                px: 2,
                borderBottom: "3px solid transparent",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                "&.Mui-selected": {
                  color: COLORS.accent,
                  fontWeight: 800,
                  borderBottom: `3px solid ${COLORS.accent}`,
                },
                "&:hover": { color: COLORS.textPrimary },
              },
            }}
          >
            <Tab
              value="all"
              icon={<FunnelIcon sx={{ fontSize: "17px !important" }} />}
              iconPosition="start"
              label={`All 17 Stages (${files.length})`}
            />
            <Tab
              value="online"
              icon={<OnlineIcon sx={{ fontSize: "17px !important" }} />}
              iconPosition="start"
              label="Online Desk (S0, S1)"
            />
            <Tab
              value="loan"
              icon={<PaymentIcon sx={{ fontSize: "17px !important" }} />}
              iconPosition="start"
              label="Loan Desk (S2, S10)"
            />
            <Tab
              value="field"
              icon={<FieldIcon sx={{ fontSize: "17px !important" }} />}
              iconPosition="start"
              label="Field Desk (S3, S4, S9, S11-14)"
            />
            <Tab
              value="accounts"
              icon={<VerifiedIcon sx={{ fontSize: "17px !important" }} />}
              iconPosition="start"
              label="Accounts Desk (S5, S7, S15)"
            />
            <Tab
              value="installation"
              icon={<InstallIcon sx={{ fontSize: "17px !important" }} />}
              iconPosition="start"
              label="Installation Desk (S6)"
            />
            <Tab
              value="portal"
              icon={<FolderIcon sx={{ fontSize: "17px !important" }} />}
              iconPosition="start"
              label="Portal Entry (S8, S17)"
            />
          </Tabs>
        </Box>

        {/* WORKFLOW STATUS SUB-TABS (Pending / Completed / Hold / Cancelled) */}
        <Box
          sx={{
            px: 2.5,
            py: 1.2,
            borderBottom: `1px solid ${COLORS.border}`,
            backgroundColor: "#F8FAFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
            {[
              { key: "all", label: "All Tasks" },
              { key: "pending", label: "Pending Action" },
              { key: "completed", label: "Completed / Passed" },
              { key: "hold", label: "On Hold (Bottlenecks)" },
              { key: "cancelled", label: "Cancelled" },
            ].map((subTab) => {
              const isSel = workflowStatusTab === subTab.key;
              return (
                <Chip
                  key={subTab.key}
                  label={subTab.label}
                  size="small"
                  onClick={() => {
                    setWorkflowStatusTab(subTab.key);
                    setPage(0);
                  }}
                  sx={{
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: isSel ? 700 : 500,
                    height: 28,
                    borderRadius: "8px",
                    backgroundColor: isSel ? COLORS.primarySoft : "#FFFFFF",
                    color: isSel ? COLORS.accent : COLORS.textSecondary,
                    border: `1px solid ${isSel ? "#BAE6FD" : COLORS.border}`,
                    "&:hover": { backgroundColor: isSel ? COLORS.primarySoft : "#F1F5F9" },
                  }}
                />
              );
            })}
          </Box>

          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textSecondary }}>
            Showing {filteredFiles.length} File(s)
          </Typography>
        </Box>

        {/* SEARCH & FILTERS TOOLBAR */}
        <Box sx={{ p: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              mb: 2,
            }}
          >
            {/* Search Input */}
            <TextField
              size="small"
              placeholder="Search Client Name, Phone, File No, AEN Office..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            {/* Filter Dropdowns */}
            <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
              {/* Stage Filter */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary }}>
                  Stage:
                </Typography>
                <Select
                  size="small"
                  value={selectedStage}
                  onChange={(e) => {
                    setSelectedStage(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    height: 36,
                    fontSize: "0.8125rem",
                    minWidth: 160,
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="all">All Stages</MenuItem>
                  {STAGES_METADATA.map((st) => (
                    <MenuItem key={st.stage} value={st.stage} sx={{ fontSize: "0.78rem" }}>
                      Stage {st.stage}: {st.name}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {/* SLA Filter */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary }}>
                  SLA:
                </Typography>
                <Select
                  size="small"
                  value={selectedSla}
                  onChange={(e) => {
                    setSelectedSla(e.target.value);
                    setPage(0);
                  }}
                  sx={{
                    height: 36,
                    fontSize: "0.8125rem",
                    minWidth: 120,
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="all">All SLAs</MenuItem>
                  <MenuItem value="safe">On Track (&lt;24h)</MenuItem>
                  <MenuItem value="overdue">SLA Overdue</MenuItem>
                </Select>
              </Box>
            </Stack>
          </Box>

          {/* UNIFIED STAGE OPERATIONS TABLE (EXACT LEADS THEME) */}
          <TableContainer
            sx={{
              borderRadius: "10px",
              border: `1px solid ${COLORS.border}`,
              overflowX: "auto",
            }}
          >
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                    FILE & CUSTOMER
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                    LIFECYCLE STAGE & AEN
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                    ASSIGNED DESK
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                    SLA DEADLINE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: COLORS.textSecondary, py: 1.4 }}>
                    PROJECT VALUE
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
                ) : filteredFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: COLORS.primary }}>
                        No files found matching your search and filter criteria.
                      </Typography>
                      <Typography sx={{ fontSize: "0.78rem", color: COLORS.textSecondary, mt: 0.3 }}>
                        Try clearing or modifying the stage or status filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFiles
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((file) => {
                      const stageInfo = STAGES_METADATA.find((s) => s.stage === file.current_stage) || {
                        name: file.stage_name || `Stage ${file.current_stage}`,
                        desk: file.assigned_role || "Back Office",
                        color: COLORS.accent,
                      };

                      const isOverdue = file.sla_color === "red";
                      const isHold = file.file_status === "On Hold" || file.stage_status === "Hold";
                      const isPaymentStage = file.current_stage === 5 || file.current_stage === 7;

                      return (
                        <TableRow
                          key={file.id}
                          hover
                          sx={{
                            backgroundColor: isHold ? "#FFFBEB" : "#FFFFFF",
                            "&:hover": { backgroundColor: isHold ? "#FEF3C7 !important" : "#F8FAFC !important" },
                          }}
                        >
                          {/* File & Customer */}
                          <TableCell sx={{ py: 1.2 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: COLORS.primary }}>
                              {file.file_number}
                            </Typography>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: COLORS.textPrimary }}>
                              {file.customer_name}
                            </Typography>
                            <Typography
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                fontSize: "0.72rem",
                                color: COLORS.textSecondary,
                                mt: 0.2,
                              }}
                            >
                              <PhoneIcon sx={{ fontSize: 12, color: COLORS.success }} /> {file.phone_number || "-"}
                            </Typography>
                          </TableCell>

                          {/* Lifecycle Stage */}
                          <TableCell sx={{ py: 1.2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  fontSize: "0.75rem",
                                  fontWeight: 800,
                                  bgcolor: COLORS.primarySoft,
                                  color: COLORS.accent,
                                  borderRadius: "6px",
                                }}
                              >
                                {file.current_stage}
                              </Avatar>
                              <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: COLORS.textPrimary }}>
                                  {stageInfo.name}
                                </Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>
                                  {file.aen_office ? `AEN: ${file.aen_office}` : "DISCOM Pipeline"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Assigned Desk */}
                          <TableCell sx={{ py: 1.2 }}>
                            <Chip
                              size="small"
                              label={stageInfo.desk}
                              sx={{
                                height: 22,
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                backgroundColor: `${stageInfo.color}15`,
                                color: stageInfo.color,
                                borderRadius: "6px",
                              }}
                            />
                          </TableCell>

                          {/* SLA Status */}
                          <TableCell sx={{ py: 1.2 }}>
                            <Chip
                              size="small"
                              label={
                                isOverdue
                                  ? "Overdue"
                                  : `${file.hours_remaining !== undefined ? file.hours_remaining : 24}h Left`
                              }
                              sx={{
                                height: 22,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                backgroundColor: isOverdue ? COLORS.dangerSoft : COLORS.successSoft,
                                color: isOverdue ? COLORS.danger : COLORS.success,
                                borderRadius: "6px",
                              }}
                            />
                          </TableCell>

                          {/* Project Cost */}
                          <TableCell sx={{ py: 1.2 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: COLORS.primary }}>
                              ₹ {Number(file.total_project_cost || 0).toLocaleString("en-IN")}
                            </Typography>
                            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted }}>
                              {file.solar_capacity || 3} kW
                            </Typography>
                          </TableCell>

                          {/* STANDARDIZED COMPACT ACTION BUTTONS (NO OVERSIZED BUTTONS) */}
                          <TableCell sx={{ py: 1.2, textAlign: "right", whiteSpace: "nowrap" }}>
                            <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                              {/* Details Button */}
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ViewIcon sx={{ fontSize: "14px !important" }} />}
                                onClick={() => handleOpenFileDetail(file.id)}
                                sx={{
                                  height: 28,
                                  px: 1.2,
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  borderRadius: "6px",
                                  textTransform: "none",
                                  borderColor: COLORS.border,
                                  color: COLORS.accent,
                                  backgroundColor: "#FFFFFF",
                                  "&:hover": { backgroundColor: COLORS.primarySoft, borderColor: COLORS.accent },
                                }}
                              >
                                Details
                              </Button>

                              {/* Special + Pay button for Payment Stages */}
                              {isPaymentStage && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PaidIcon sx={{ fontSize: "14px !important" }} />}
                                  onClick={() => handleOpenAddPayment(file)}
                                  sx={{
                                    height: 28,
                                    px: 1.2,
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    borderRadius: "6px",
                                    textTransform: "none",
                                    borderColor: COLORS.success,
                                    color: COLORS.success,
                                    backgroundColor: "#FFFFFF",
                                    "&:hover": { backgroundColor: COLORS.successSoft },
                                  }}
                                >
                                  + Pay
                                </Button>
                              )}

                              {/* Pass Stage Action */}
                              <Button
                                size="small"
                                variant="contained"
                                endIcon={<SubmitIcon sx={{ fontSize: "14px !important" }} />}
                                onClick={() => handleQuickAction(file, "Submit")}
                                sx={{
                                  height: 28,
                                  px: 1.4,
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  borderRadius: "6px",
                                  textTransform: "none",
                                  backgroundColor: COLORS.accent,
                                  "&:hover": { backgroundColor: COLORS.primary },
                                }}
                              >
                                Pass Stage
                              </Button>

                              {/* Hold Action Button */}
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleQuickAction(file, "Hold")}
                                sx={{
                                  height: 28,
                                  px: 1.2,
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  borderRadius: "6px",
                                  textTransform: "none",
                                  borderColor: COLORS.warning,
                                  color: COLORS.warning,
                                  "&:hover": { backgroundColor: COLORS.warningSoft },
                                }}
                              >
                                Hold
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

          {/* Clean Pagination */}
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredFiles.length}
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
      </Paper>
        </>
      )}

      {/* 7. REMARK VALIDATION MODAL FOR HOLD / CANCEL (10-WORD CHECK) */}
      <RemarkValidationModal
        open={remarkModalOpen}
        onClose={() => setRemarkModalOpen(false)}
        onSubmit={handleRemarkSubmit}
        actionType={pendingActionType}
        fileNumber={selectedFileForAction?.file_number || ""}
        customerName={selectedFileForAction?.customer_name || ""}
        loading={actionLoading}
      />

      {/* 8. ADD PAYMENT MODAL (FOR PAYMENT STAGES 5 & 7) */}
      <Dialog
        open={addPaymentOpen}
        onClose={() => setAddPaymentOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "14px" } }}
      >
        <DialogTitle sx={{ p: 2, borderBottom: `1px solid ${COLORS.border}` }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: COLORS.primary }}>
            Record Customer Project Payment
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.2 }}>
            File: {paymentTargetFile?.file_number} • Customer: {paymentTargetFile?.customer_name}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                Payment Stage
              </Typography>
              <Select
                fullWidth
                size="small"
                value={paymentForm.payment_stage}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_stage: e.target.value })}
                sx={{ borderRadius: "8px", fontSize: "0.8125rem" }}
              >
                <MenuItem value="Pre-Install">Pre-Install Advance (Stage 5)</MenuItem>
                <MenuItem value="Post-Install">Post-Install Balance (Stage 7)</MenuItem>
                <MenuItem value="Subsidy Adjustment">Subsidy Adjustment</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                Amount (₹)
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                placeholder="Enter payment amount"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.8125rem" } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                Payment Mode
              </Typography>
              <Select
                fullWidth
                size="small"
                value={paymentForm.payment_mode}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                sx={{ borderRadius: "8px", fontSize: "0.8125rem" }}
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="NEFT">NEFT / RTGS</MenuItem>
                <MenuItem value="UPI">UPI / Online</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textSecondary, mb: 0.5 }}>
                Reference / Transaction #
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="UTR / Cheque / Receipt Number"
                value={paymentForm.reference_number}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.8125rem" } }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setAddPaymentOpen(false)}
            sx={{ height: 32, borderRadius: "8px", textTransform: "none", fontSize: "0.78rem" }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={paymentSubmitting}
            onClick={handleAddPaymentSubmit}
            sx={{
              height: 32,
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "0.78rem",
              fontWeight: 700,
              backgroundColor: COLORS.success,
              "&:hover": { backgroundColor: "#15803D" },
            }}
          >
            {paymentSubmitting ? "Recording..." : "Save Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 9. COMPLETE FILE DETAIL & 17-STAGE AUDIT TIMELINE MODAL */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
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
              File Details & 17-Stage Audit Timeline
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.2 }}>
              {fileDetailData?.file?.file_number || "File Details"} • Customer: {fileDetailData?.file?.customer_name}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setDetailModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5, backgroundColor: "#F8FAFC" }}>
          {detailLoading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress size={36} sx={{ color: COLORS.accent }} />
              <Typography sx={{ fontSize: "0.82rem", color: COLORS.textSecondary, mt: 1 }}>
                Loading file timeline and ledger details...
              </Typography>
            </Box>
          ) : fileDetailData ? (
            <Stack spacing={2.5}>
              {/* Summary Strip */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: "10px",
                  backgroundColor: "#FFFFFF",
                  border: `1px solid ${COLORS.border}`,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>
                    FILE NUMBER
                  </Typography>
                  <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: COLORS.primary }}>
                    {fileDetailData.file?.file_number}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>
                    CURRENT STAGE
                  </Typography>
                  <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: COLORS.accent }}>
                    Stage {fileDetailData.file?.current_stage}: {fileDetailData.file?.stage_name}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>
                    PROJECT COST
                  </Typography>
                  <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: COLORS.success }}>
                    ₹ {Number(fileDetailData.file?.total_project_cost || 0).toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", color: COLORS.textMuted, fontWeight: 700 }}>
                    SOLAR CAPACITY
                  </Typography>
                  <Typography sx={{ fontSize: "0.92rem", fontWeight: 800, color: COLORS.primary }}>
                    {fileDetailData.file?.solar_capacity || 3} kW
                  </Typography>
                </Box>
              </Box>

              {/* Payments Section in Detail Modal */}
              {fileDetailData.payments && fileDetailData.payments.length > 0 && (
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.primary, mb: 1 }}>
                    Recorded Customer Payments ({fileDetailData.payments.length})
                  </Typography>
                  <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: "#F8FAFC" }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>STAGE</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>AMOUNT</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>MODE & REF</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>STATUS</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", textAlign: "right" }}>ACTION</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fileDetailData.payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{p.payment_stage}</TableCell>
                            <TableCell sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.success }}>
                              ₹ {Number(p.amount || 0).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.75rem", color: COLORS.textSecondary }}>
                              {p.payment_mode} {p.reference_number ? `(${p.reference_number})` : ""}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={p.status || "Pending"}
                                sx={{
                                  height: 20,
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  backgroundColor: p.status === "Verified" ? COLORS.successSoft : COLORS.warningSoft,
                                  color: p.status === "Verified" ? COLORS.success : COLORS.warning,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: "right" }}>
                              {p.status !== "Verified" ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleVerifyPayment(p.id)}
                                  sx={{
                                    height: 24,
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    borderRadius: "4px",
                                    textTransform: "none",
                                    backgroundColor: COLORS.success,
                                  }}
                                >
                                  Verify
                                </Button>
                              ) : (
                                <Typography sx={{ fontSize: "0.72rem", color: COLORS.success, fontWeight: 700 }}>
                                  Verified
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* 17-Stage Timeline */}
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: COLORS.primary, mb: 1 }}>
                  17-Stage Audit Log & Operator Remarks
                </Typography>
                <Stack spacing={1}>
                  {(fileDetailData.timeline || []).map((tl, idx) => (
                    <Box
                      key={tl.id || idx}
                      sx={{
                        p: 1.4,
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        border: `1px solid ${COLORS.border}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            size="small"
                            label={`Stage ${tl.stage_number}`}
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              backgroundColor: COLORS.primarySoft,
                              color: COLORS.accent,
                            }}
                          />
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.textPrimary }}>
                            {tl.stage_name}
                          </Typography>
                          <Chip
                            size="small"
                            label={tl.action_taken}
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              backgroundColor:
                                tl.action_taken === "Hold"
                                  ? COLORS.warningSoft
                                  : tl.action_taken === "Cancel"
                                  ? COLORS.dangerSoft
                                  : COLORS.successSoft,
                              color:
                                tl.action_taken === "Hold"
                                  ? COLORS.warning
                                  : tl.action_taken === "Cancel"
                                  ? COLORS.danger
                                  : COLORS.success,
                            }}
                          />
                        </Stack>
                        <Typography sx={{ fontSize: "0.75rem", color: COLORS.textSecondary, mt: 0.4 }}>
                          By <b>{tl.performed_by_name || "Staff"}</b> ({tl.performed_by_role || "Back Office"})
                        </Typography>
                        {tl.remarks && (
                          <Typography
                            sx={{
                              mt: 0.6,
                              fontSize: "0.78rem",
                              fontStyle: "italic",
                              color: "#334155",
                              backgroundColor: "#F8FAFC",
                              p: 0.8,
                              borderRadius: "6px",
                            }}
                          >
                            "{tl.remarks}"
                          </Typography>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: "0.72rem", color: COLORS.textMuted }}>
                        {new Date(tl.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setDetailModalOpen(false)}
            sx={{
              height: 32,
              px: 2,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.78rem",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
