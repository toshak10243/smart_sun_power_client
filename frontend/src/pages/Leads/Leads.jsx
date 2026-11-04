import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
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
  Autocomplete,
  Alert as MuiAlert,
  Breadcrumbs,
  Slide,
  Grow,
  Fade,
  Tabs,
  Tab,
} from "@mui/material";

import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AssignmentInd as AssignIcon,
  Event as FollowupIcon,
  Visibility as ViewIcon,
  Call as CallIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  FiberNew as FiberNewIcon,
  EmojiEvents as WonIcon,
  HighlightOff as LostIcon,
  History as HistoryIcon,
  Inbox as InboxIcon,
  HomeWork as SiteVisitIcon,
  MoreVert as MoreVertIcon,
  HomeOutlined as HomeOutlinedIcon,
  NavigateNextRounded as NavigateNextRoundedIcon,
  FilterListOff as FilterListOffIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  SolarPower as SolarIcon,
  AttachMoney as MoneyIcon,
  Notes as NotesIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  UploadFile as UploadFileIcon,
  ViewAgendaOutlined as ViewAgendaOutlinedIcon,
  TableRowsOutlined as TableRowsOutlinedIcon,
  CalendarMonthOutlined as CalendarMonthOutlinedIcon,
  PhoneOutlined as PhoneOutlinedIcon,
  EventRepeatRounded as EventRepeatRoundedIcon,
  SendRounded as SendRoundedIcon,
  CloseRounded as CloseRoundedIcon,
  HistoryRounded as HistoryRoundedIcon,
} from "@mui/icons-material";

import { State, City } from "country-state-city";

import {
  getLeads,
  getLeadById,
  checkDuplicateLead,
  createLead,
  updateLead,
  updateLeadStatus,
  assignLead,
  addFollowup,
  getFollowups,
  getActivityLogs,
  deleteLead,
} from "../../services/leadService";

import { getUsers } from "../../services/userServices";
import ImportLeadsDialog from "../../components/ImportLeadsDialog";
import NotInterestedModal from "../../components/NotInterestedModal";
import WonStageModal from "../../components/WonStageModal";
import SiteVisitModal from "../../components/SiteVisitModal";
import QuotationModal from "../../components/QuotationModal";
import NoResponseModal from "../../components/NoResponseModal";
import FollowUpDateModal from "../../components/FollowUpDateModal";
import AuditHistoryTab from "../../components/AuditHistoryTab";

/* ============================================================
   DESIGN TOKENS
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
  "Site Visit Completed",
  "Quotation Sent",
  "Negotiation",
  "Won",
  "Lost",
  "Not Interested",
  "No Response",
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const LEAD_SOURCE_OPTIONS = ["Website", "Call", "Reference", "Facebook", "Google", "Other"];
const SOLAR_REQUIREMENT_OPTIONS = ["Residential", "Commercial"];
const FOLLOWUP_TYPE_OPTIONS = ["Call", "WhatsApp", "SMS", "Meeting", "Site Visit", "Other"];
const INTEREST_OPTIONS = ["Pending", "Interested", "Not Interested"];

const INITIAL_FORM_STATE = {
  customer_name: "",
  mobile_number: "",
  alternate_number: "",
  email: "",
  address: "",
  city: "Jaipur",
  state: "Rajasthan",
  pincode: "",
  solar_requirement: "Residential",
  interest_status: "Pending",
  required_kw: "",
  remark: "",
  lead_source: "Website",
  priority: "Medium",
  status: "New Lead",
  assigned_to: "",
  next_follow_up_date: "",
  site_visit_date: "",
  quotation_amount: "",
};

const INITIAL_FILTERS = {
  search: "",
  status: "",
  priority: "",
  lead_source: "",
  assigned_to: "",
  date_from: "",
  date_to: "",
};

const SlideTransition = React.forwardRef((props, ref) => (
  <Slide ref={ref} {...props} direction="left" />
));

/* ============================================================
   SHARED STYLES
   ============================================================ */
const cardSx = {
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
};

const primaryButtonSx = {
  height: 38,
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.8125rem",
  px: 2,
  backgroundColor: COLORS.primary,
  boxShadow: "none",
  whiteSpace: "nowrap",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "&:hover": {
    backgroundColor: COLORS.primaryDark,
    boxShadow: "none",
  },
};

const outlinedButtonSx = {
  height: 38,
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.8125rem",
  px: 1.8,
  borderColor: COLORS.border,
  backgroundColor: COLORS.card,
  color: COLORS.textPrimary,
  whiteSpace: "nowrap",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F8FAFC" },
};

const iconSquareBtnSx = {
  width: 36,
  height: 36,
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.primary,
  backgroundColor: COLORS.card,
  "&:hover": { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
};

const controlSx = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FAFBFC",
    fontSize: "0.8125rem",
    color: COLORS.textPrimary,
    minHeight: 40,
    "& fieldset": { borderColor: COLORS.border, borderWidth: "1px" },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input": {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "0.8125rem",
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    fontSize: "0.8125rem",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  "& .MuiInputLabel-root": {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "0.8125rem",
    color: COLORS.textSecondary,
    "&.Mui-focused": { color: COLORS.primary },
  },
  "& .MuiFormHelperText-root": {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "0.7rem",
    marginLeft: "14px",
  },
};

const dateControlSx = {
  ...controlSx,
  "& .MuiOutlinedInput-root": {
    ...controlSx["& .MuiOutlinedInput-root"],
    "& input[type='date']": {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: "0.8125rem",
      colorScheme: "light",
    },
  },
};

const FieldLabel = ({ children }) => (
  <Typography
    sx={{
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: COLORS.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      mb: 0.5,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}
  >
    {children}
  </Typography>
);

/* ============================================================
   VIEW DRAWER - INFO ROW COMPONENT
   ============================================================ */
const InfoRow = ({ icon, label, value, valueColor }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      gap: 1.5,
      py: 1.2,
      px: 1,
      borderRadius: "8px",
      transition: "background-color 0.15s ease",
      "&:hover": { backgroundColor: "#F8FAFC" },
    }}
  >
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: "8px",
        backgroundColor: COLORS.primarySoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        sx={{
          fontSize: "0.6875rem",
          fontWeight: 500,
          color: COLORS.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          mb: 0.15,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 600,
          color: valueColor || COLORS.textPrimary,
          fontFamily: "'Inter', sans-serif",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

/* ============================================================
   VIEW DRAWER - ACTIVITY LOG ITEM
   ============================================================ */
const ActivityLogItem = ({ log, index }) => (
  <Box
    sx={{
      display: "flex",
      gap: 1.5,
      position: "relative",
      pb: 2.5,
    }}
  >
    {index < 9 && (
      <Box
        sx={{
          position: "absolute",
          left: 15,
          top: 36,
          bottom: 0,
          width: 2,
          backgroundColor: COLORS.border,
        }}
      />
    )}
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        backgroundColor: COLORS.primarySoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        zIndex: 1,
        border: `2px solid ${COLORS.card}`,
      }}
    >
      <TimelineIcon sx={{ fontSize: 14, color: COLORS.primary }} />
    </Box>
    <Box
      sx={{
        flex: 1,
        backgroundColor: "#F8FAFC",
        borderRadius: "10px",
        p: 1.5,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: COLORS.textPrimary,
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.5,
        }}
      >
        {log.remark || `${log.action_type}${log.old_value ? ` — ${log.old_value} → ${log.new_value}` : ""}`}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.6875rem",
          color: COLORS.textMuted,
          mt: 0.5,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {log.performed_by_name && `${log.performed_by_name} · `}
        {formatDate(log.created_at || log.updated_at)}
      </Typography>
    </Box>
  </Box>
);

/* ============================================================
   VIEW DRAWER - SECTION CARD
   ============================================================ */
const DetailSectionCard = ({ title, children, icon }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: "12px",
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.card,
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        px: 2,
        py: 1.5,
        backgroundColor: "#F8FAFC",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 3,
            height: 16,
            borderRadius: "2px",
            backgroundColor: COLORS.primary,
          }}
        />
      )}
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: COLORS.primaryDark,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {title}
      </Typography>
    </Box>
    <Box sx={{ p: 1.5 }}>{children}</Box>
  </Card>
);

/* ============================================================
   HELPERS
   ============================================================ */
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatCurrency = (value) => {
  if (!value) return "—";
  const num = Number(value);
  if (isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const STATUS_STYLES = {
  "New Lead": { color: "#0284C7", bg: "#E0F2FE" },
  Contacted: { color: "#00B5EF", bg: "#E0F7FF" },
  "Follow-up Pending": { color: COLORS.warning, bg: COLORS.warningSoft },
  "Site Visit Scheduled": { color: COLORS.purple, bg: COLORS.purpleSoft },
  "Site Visit Completed": { color: "#059669", bg: "#D1FAE5" },
  "Quotation Sent": { color: "#9333EA", bg: "#F3E8FF" },
  Negotiation: { color: "#C026D3", bg: "#FCE7F3" },
  Won: { color: COLORS.success, bg: COLORS.successSoft },
  Lost: { color: COLORS.danger, bg: COLORS.dangerSoft },
  "Not Interested": { color: COLORS.textSecondary, bg: "#F1F5F9" },
  "No Response": { color: "#EA580C", bg: "#FFEDD5" },
};

const PRIORITY_STYLES = {
  High: { color: COLORS.danger, bg: COLORS.dangerSoft },
  Medium: { color: COLORS.warning, bg: COLORS.warningSoft },
  Low: { color: COLORS.success, bg: COLORS.successSoft },
};

const StatusChip = ({ status }) => {
  const style = STATUS_STYLES[status] || { color: COLORS.textMuted, bg: "#F1F2F4" };
  return (
    <Chip
      label={status || "—"}
      size="small"
      sx={{
        color: style.color,
        backgroundColor: style.bg,
        fontWeight: 600,
        fontSize: "0.6875rem",
        height: 22,
        borderRadius: "6px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    />
  );
};

const PriorityChip = ({ priority }) => {
  const style = PRIORITY_STYLES[priority] || { color: COLORS.textMuted, bg: "#F1F2F4" };
  return (
    <Chip
      label={priority || "—"}
      size="small"
      variant="outlined"
      sx={{
        color: style.color,
        borderColor: `${style.color}40`,
        backgroundColor: style.bg,
        fontWeight: 600,
        fontSize: "0.6875rem",
        height: 22,
        borderRadius: "6px",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    />
  );
};

/* ============================================================
   KPI CARD
   ============================================================ */
const KpiCard = ({ icon, label, value, accent, loading, index = 0 }) => (
  <Card
    elevation={0}
    sx={{
      width: "100%",
      borderRadius: "12px",
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.card,
      boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        boxShadow: "0 4px 14px rgba(11, 58, 99, 0.08)",
        transform: "translateY(-2px)",
        borderColor: accent || COLORS.accent,
      },
    }}
  >
    <CardContent sx={{ p: 1.6, "&:last-child": { pb: 1.6 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
        <Typography
          variant="caption"
          sx={{
            color: COLORS.textSecondary,
            fontWeight: 700,
            fontSize: "0.7rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            fontFamily: "'Inter', sans-serif",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </Typography>
        <Avatar
          sx={{
            width: 28,
            height: 28,
            borderRadius: "7px",
            bgcolor: `${accent}14`,
            color: accent,
          }}
        >
          {icon}
        </Avatar>
      </Box>
      {loading ? (
        <Skeleton width={48} height={26} />
      ) : (
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: COLORS.textPrimary,
            fontSize: "1.3rem",
            lineHeight: 1.1,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {value ?? 0}
        </Typography>
      )}
    </CardContent>
  </Card>
);

/* ============================================================
   EMPTY STATE
   ============================================================ */
const EmptyState = ({ onAdd }) => (
  <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.2 }}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: "14px",
        backgroundColor: COLORS.primarySoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.primary,
      }}
    >
      <InboxIcon sx={{ fontSize: 28 }} />
    </Box>
    <Typography
      variant="subtitle1"
      fontWeight={600}
      color={COLORS.textPrimary}
      sx={{ fontSize: "0.9375rem", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      No Leads Found
    </Typography>
    <Typography
      variant="body2"
      color={COLORS.textSecondary}
      sx={{ maxWidth: 300, textAlign: "center", fontSize: "0.8125rem", lineHeight: 1.5, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      Try adjusting your search or filters, or create a new solar enquiry.
    </Typography>
    <Button
      variant="contained"
      size="small"
      startIcon={<AddIcon sx={{ fontSize: 15 }} />}
      onClick={onAdd}
      sx={{ ...primaryButtonSx, mt: 0.5 }}
    >
      Add Lead
    </Button>
  </Box>
);

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function Leads() {
  const location = useLocation();
  const [leads, setLeads] = useState([]);
  const [viewMode, setViewMode] = useState("box");
  const [inlineRemarks, setInlineRemarks] = useState({});
  const [savingRemarkLeadId, setSavingRemarkLeadId] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeLeadForHistory, setActiveLeadForHistory] = useState(null);
  const [historyRemarks, setHistoryRemarks] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleQuickAddRemark = async (leadId) => {
    const text = inlineRemarks[leadId]?.trim();
    if (!text) return;
    setSavingRemarkLeadId(leadId);
    try {
      await addFollowup(leadId, {
        note: text,
        followup_type: "Call",
      });
      setInlineRemarks((prev) => ({ ...prev, [leadId]: "" }));
      setLeads((prevLeads) =>
        prevLeads.map((l) =>
          l.id === leadId
            ? {
                ...l,
                latest_remark: text,
                latest_remark_date: new Date().toISOString(),
                latest_remark_by: "You",
                total_remarks: (Number(l.total_remarks) || 0) + 1,
              }
            : l
        )
      );
      showSnackbar("Remark added successfully!", "success");
      fetchLeadsList();
      fetchKpiSnapshot();
    } catch (err) {
      console.error("Failed to add remark:", err);
      showSnackbar(err?.response?.data?.message || "Failed to add remark.", "error");
    } finally {
      setSavingRemarkLeadId(null);
    }
  };

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

      // If the lead has an initial remark (e.g. lead.remark), include it in history!
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

      // Sort newest first
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
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);

  const [kpiLeads, setKpiLeads] = useState([]);
  const [kpiLoading, setKpiLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [anchorEl, setAnchorEl] = useState(null);
  const [activeLead, setActiveLead] = useState(null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateChecking, setDuplicateChecking] = useState(false);

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewDrawerTab, setViewDrawerTab] = useState(0);
  const [viewLead, setViewLead] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewFollowups, setViewFollowups] = useState([]);
  const [viewLogs, setViewLogs] = useState([]);
  const [notInterestedLead, setNotInterestedLead] = useState(null);
  const [wonStageLead, setWonStageLead] = useState(null);
  const [siteVisitLead, setSiteVisitLead] = useState(null);
  const [siteVisitMode, setSiteVisitMode] = useState("schedule");
  const [quotationLead, setQuotationLead] = useState(null);
  const [noResponseLead, setNoResponseLead] = useState(null);
  const [followUpDateLead, setFollowUpDateLead] = useState(null);
  const [targetFollowUpStatus, setTargetFollowUpStatus] = useState("Contacted");

  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [assignedToUser, setAssignedToUser] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const [followupDrawerOpen, setFollowupDrawerOpen] = useState(false);
  const [followupData, setFollowupData] = useState({
    note: "",
    followup_type: "Call",
    next_follow_up_date: "",
    status_after_followup: "",
  });
  const [followupSaving, setFollowupSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // State & City Data
  const indianStates = useMemo(() => State.getStatesOfCountry("IN"), []);
  const [cityOptions, setCityOptions] = useState([]);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getUsers({ limit: 100 });
      const responseData = res?.data;
      if (responseData?.success) {
        setUsersList(responseData.data || []);
      }
    } catch (err) {
      console.error("Error fetching users for dropdown:", err);
    }
  }, []);

  const buildQueryParams = useCallback(
    (overrides = {}) => ({
      search: filters.search,
      status: filters.status,
      priority: filters.priority,
      lead_source: filters.lead_source,
      assigned_to: filters.assigned_to,
      date_from: filters.date_from,
      date_to: filters.date_to,
      ...overrides,
    }),
    [filters]
  );

  const fetchLeadsList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeads(buildQueryParams({ page: page + 1, limit: rowsPerPage }));
      if (res?.success) {
        setLeads(res.data || []);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Unable to load leads. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, page, rowsPerPage, showSnackbar]);

  const fetchKpiSnapshot = useCallback(async () => {
    setKpiLoading(true);
    try {
      const res = await getLeads(buildQueryParams({ page: 1, limit: 5000 }));
      if (res?.success) setKpiLeads(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setKpiLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchLeadsList();
  }, [fetchLeadsList]);

  useEffect(() => {
    fetchKpiSnapshot();
  }, [filters]);

  const kpis = useMemo(() => {
    const total = totalCount || kpiLeads.length;
    const newLeads = kpiLeads.filter((l) => l.status === "New Lead").length;
    const followups = kpiLeads.filter((l) => l.next_follow_up_date && !["Won", "Lost", "Not Interested"].includes(l.status)).length;
    const siteVisits = kpiLeads.filter((l) => l.status === "Site Visit Scheduled").length;
    const won = kpiLeads.filter((l) => l.status === "Won").length;
    const lost = kpiLeads.filter((l) => l.status === "Lost").length;
    return { total, newLeads, followups, siteVisits, won, lost };
  }, [kpiLeads, totalCount]);

  const resetForm = useCallback(() => {
    setSelectedLead(null);
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    const rajState = indianStates.find((s) => s.name === "Rajasthan");
    setCityOptions(rajState ? City.getCitiesOfState("IN", rajState.isoCode) : []);
    setDuplicateWarning(null);
    setDuplicateChecking(false);
  }, [indianStates]);

  const openCreateDialog = useCallback(() => {
    resetForm();
    setFormDialogOpen(true);
  }, [resetForm]);

  useEffect(() => {
    const handleOpenCreateModal = () => {
      openCreateDialog();
    };
    window.addEventListener("open-create-lead-dialog", handleOpenCreateModal);

    if (location?.state?.openAddLead) {
      openCreateDialog();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (typeof window !== "undefined" && window.location.search.includes("action=add")) {
      openCreateDialog();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => {
      window.removeEventListener("open-create-lead-dialog", handleOpenCreateModal);
    };
  }, [openCreateDialog, location?.state]);

  const openEditDialog = useCallback((lead) => {
    setSelectedLead(lead);
    if (lead.state) {
      const stateObj = indianStates.find((s) => s.name === lead.state);
      setCityOptions(stateObj ? City.getCitiesOfState("IN", stateObj.isoCode) : []);
    } else {
      setCityOptions([]);
    }

    setFormData({
      customer_name: lead.customer_name || "",
      mobile_number: lead.mobile_number || "",
      alternate_number: lead.alternate_number || "",
      email: lead.email || "",
      address: lead.address || "",
      city: lead.city || "",
      state: lead.state || "",
      pincode: lead.pincode || "",
      solar_requirement: lead.solar_requirement || "Residential",
      interest_status: lead.interest_status || "Pending",
      required_kw: lead.required_kw || "",
      remark: lead.remark || "",
      lead_source: lead.lead_source || "Website",
      priority: lead.priority || "Medium",
      status: lead.status || "New Lead",
      assigned_to: lead.assigned_to || "",
      next_follow_up_date: lead.next_follow_up_date ? lead.next_follow_up_date.slice(0, 10) : "",
      site_visit_date: lead.site_visit_date ? lead.site_visit_date.slice(0, 10) : "",
      quotation_amount: lead.quotation_amount || "",
    });
    setFormErrors({});
    setDuplicateWarning(null);
    setDuplicateChecking(false);
    setFormDialogOpen(true);
    setAnchorEl(null);
  }, [indianStates]);

  const handleMobileBlur = useCallback(async () => {
    const mobile = formData.mobile_number.trim();
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      setDuplicateWarning(null);
      return;
    }
    setDuplicateChecking(true);
    try {
      const res = await checkDuplicateLead(mobile, selectedLead?.id || null);
      if (res?.is_duplicate && res?.data) {
        setDuplicateWarning(res.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error(err);
      setDuplicateWarning(null);
    } finally {
      setDuplicateChecking(false);
    }
  }, [formData.mobile_number, selectedLead]);

  const validateForm = useCallback((data) => {
    const errors = {};
    if (!data.customer_name.trim()) errors.customer_name = "Customer name is required";
    if (!data.mobile_number.trim()) {
      errors.mobile_number = "Mobile number is required";
    } else if (!/^\d{10}$/.test(data.mobile_number.trim())) {
      errors.mobile_number = "Enter a valid 10-digit mobile number";
    }
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.email = "Enter a valid email address";
    }
    if (data.required_kw && Number(data.required_kw) < 0) {
      errors.required_kw = "kW cannot be negative";
    }
    if (data.interest_status === "Interested" && (!data.required_kw || Number(data.required_kw) <= 0)) {
      errors.required_kw = "Required kW is mandatory when Interest Status is Interested";
    }
    if (data.interest_status === "Not Interested" && !data.remark.trim()) {
      errors.remark = "Remark is mandatory when Interest Status is Not Interested";
    }
    return errors;
  }, []);

  const handleFormFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === "mobile_number") {
      setDuplicateWarning(null);
    }
  }, []);

  const handleStateChange = useCallback((e) => {
    const stateName = e.target.value;
    handleFormFieldChange("state", stateName);
    handleFormFieldChange("city", "");
    const stateObj = indianStates.find((s) => s.name === stateName);
    setCityOptions(stateObj ? City.getCitiesOfState("IN", stateObj.isoCode) : []);
  }, [handleFormFieldChange, indianStates]);

  const handleCityChange = useCallback((e) => {
    handleFormFieldChange("city", e.target.value);
  }, [handleFormFieldChange]);

  const handleFormSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errors = validateForm(formData);
      setFormErrors(errors);
      if (Object.keys(errors).length > 0) return;

      if (duplicateWarning) {
        showSnackbar(`Duplicate lead detected (${duplicateWarning.lead_code}). Cannot add lead with duplicate mobile number.`, "error");
        return;
      }

      setSaving(true);
      try {
        if (selectedLead) {
          await updateLead(selectedLead.id, formData);
          showSnackbar("Lead updated successfully.");
        } else {
          await createLead(formData);
          showSnackbar("Lead created successfully.");
        }
        setFormDialogOpen(false);
        resetForm();
        fetchLeadsList();
        fetchKpiSnapshot();
      } catch (err) {
        console.error(err);
        showSnackbar(err.response?.data?.message || "Something went wrong while saving the lead.", "error");
      } finally {
        setSaving(false);
      }
    },
    [formData, selectedLead, validateForm, resetForm, fetchLeadsList, fetchKpiSnapshot, showSnackbar]
  );

  const openViewDrawer = useCallback(async (lead) => {
    setAnchorEl(null);
    setViewDrawerTab(0);
    setViewDrawerOpen(true);
    setViewLoading(true);
    setViewLead(lead);
    setViewFollowups([]);
    setViewLogs([]);
    try {
      const [leadRes, followupRes, logsRes] = await Promise.all([
        getLeadById(lead.id).catch(() => null),
        getFollowups(lead.id).catch(() => null),
        getActivityLogs(lead.id).catch(() => null),
      ]);
      if (leadRes?.success && leadRes.data) setViewLead(leadRes.data);
      if (followupRes?.success) setViewFollowups(followupRes.data || []);
      if (logsRes?.success) setViewLogs(logsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setViewLoading(false);
    }
  }, []);

  const openAssignDrawer = useCallback(
    (lead) => {
      setActiveLead(lead);
      const currentUser = usersList.find((u) => u.id === lead.assigned_to) || null;
      setAssignedToUser(currentUser);
      setAssignDrawerOpen(true);
      setAnchorEl(null);
    },
    [usersList]
  );

  const handleAssignSubmit = useCallback(async () => {
    if (!assignedToUser || !activeLead) return;
    setAssigning(true);
    try {
      await assignLead(activeLead.id, { assigned_to: assignedToUser.id });
      showSnackbar(`Lead assigned to ${assignedToUser.full_name}.`);
      setAssignDrawerOpen(false);
      fetchLeadsList();
      fetchKpiSnapshot();
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Unable to assign lead.", "error");
    } finally {
      setAssigning(false);
    }
  }, [assignedToUser, activeLead, fetchLeadsList, fetchKpiSnapshot, showSnackbar]);

  const openFollowupDrawer = useCallback((lead) => {
    setActiveLead(lead);
    setFollowupData({ note: "", followup_type: "Call", next_follow_up_date: "", status_after_followup: "" });
    setFollowupDrawerOpen(true);
    setAnchorEl(null);
  }, []);

  const handleFollowupSubmit = useCallback(async () => {
    if (!followupData.note.trim() || !activeLead) return;
    setFollowupSaving(true);
    try {
      await addFollowup(activeLead.id, {
        note: followupData.note,
        followup_type: followupData.followup_type,
        follow_up_date: followupData.next_follow_up_date || undefined,
        status_after_followup: followupData.status_after_followup || undefined,
      });
      showSnackbar("Follow-up logged successfully.");
      setFollowupDrawerOpen(false);
      fetchLeadsList();
      fetchKpiSnapshot();
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Unable to save follow-up.", "error");
    } finally {
      setFollowupSaving(false);
    }
  }, [followupData, activeLead, fetchLeadsList, fetchKpiSnapshot, showSnackbar]);

  const openDeleteDialog = useCallback((lead) => {
    setActiveLead(lead);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!activeLead) return;
    setDeleting(true);
    try {
      await deleteLead(activeLead.id);
      showSnackbar("Lead deleted.");
      setDeleteDialogOpen(false);
      fetchLeadsList();
      fetchKpiSnapshot();
    } catch (err) {
      console.error(err);
      showSnackbar(err.response?.data?.message || "Unable to delete lead.", "error");
    } finally {
      setDeleting(false);
    }
  }, [activeLead, fetchLeadsList, fetchKpiSnapshot, showSnackbar]);

  const handleMenuOpen = useCallback((event, lead) => {
    setAnchorEl(event.currentTarget);
    setActiveLead(lead);
  }, []);

  const handleMenuClose = useCallback(() => setAnchorEl(null), []);

  const handleStatusSelect = useCallback((targetLead, newStatus) => {
    if (!targetLead || !newStatus || targetLead.status === newStatus) return;
    if (newStatus === "Not Interested") {
      setNotInterestedLead(targetLead);
      return;
    }
    if (newStatus === "Won") {
      setWonStageLead(targetLead);
      return;
    }
    if (newStatus === "Site Visit Scheduled" || newStatus === "Site Visit Completed") {
      setSiteVisitLead(targetLead);
      setSiteVisitMode(newStatus === "Site Visit Scheduled" ? "schedule" : "complete");
      return;
    }
    if (newStatus === "Quotation Sent") {
      setQuotationLead(targetLead);
      return;
    }
    if (newStatus === "No Response") {
      setNoResponseLead(targetLead);
      return;
    }
    if (newStatus === "Follow-up Pending" || newStatus === "Contacted") {
      setFollowUpDateLead(targetLead);
      setTargetFollowUpStatus(newStatus);
      return;
    }
  }, []);

  const handleAdminReopen = useCallback(
    async (leadToReopen) => {
      const target = leadToReopen || viewLead;
      if (!target?.id) return;
      try {
        await updateLeadStatus(target.id, {
          status: "Contacted",
          remark: "Lead reopened by Super Admin",
        });
        showSnackbar(`Lead ${target.lead_code || target.customer_name} reopened successfully.`);
        if (viewDrawerOpen && viewLead?.id === target.id) {
          setViewLead((prev) => ({ ...prev, status: "Contacted" }));
          const [lRes, logsRes] = await Promise.all([
            getLeadById(target.id).catch(() => null),
            getActivityLogs(target.id).catch(() => null),
          ]);
          if (lRes?.data) setViewLead(lRes.data);
          if (logsRes?.data) setViewLogs(logsRes.data);
        }
        fetchLeadsList();
        fetchKpiSnapshot();
      } catch (err) {
        console.error(err);
        showSnackbar(err.response?.data?.message || "Failed to reopen lead.", "error");
      }
    },
    [viewLead, viewDrawerOpen, fetchLeadsList, fetchKpiSnapshot, showSnackbar]
  );

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setPage(0);
        setFilters((prev) => ({ ...prev, search: searchInput }));
      }
    },
    [searchInput]
  );

  const handleSearchBlur = useCallback(() => {
    setPage(0);
    setFilters((prev) => ({ ...prev, search: searchInput }));
  }, [searchInput]);

  const handleFilterChange = useCallback((field, value) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setSearchInput("");
    setPage(0);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchLeadsList();
    fetchKpiSnapshot();
  }, [fetchLeadsList, fetchKpiSnapshot]);

  const handleCall = useCallback((mobile) => {
    if (!mobile) return;
    window.location.href = `tel:${mobile}`;
  }, []);

  const handleWhatsApp = useCallback((mobile) => {
    if (!mobile) return;
    const cleaned = mobile.replace(/\D/g, "");
    window.open(`https://wa.me/91${cleaned}`, "_blank", "noopener,noreferrer");
  }, []);

  const handleExportCSV = useCallback(() => {
    if (kpiLeads.length === 0) {
      showSnackbar("No data available to export.", "warning");
      return;
    }

    const headers = [
      "Lead Code",
      "Customer Name",
      "Mobile Number",
      "Alternate Number",
      "Email",
      "Address",
      "City",
      "State",
      "Pincode",
      "Solar Requirement",
      "Required kW",
      "Interest Status",
      "Lead Source",
      "Priority",
      "Status",
      "Assigned To",
      "Assign Date",
      "Next Follow-up Date",
      "Site Visit Date",
      "Quotation Amount",
      "Remark",
    ];

    const escapeCsv = (val) => {
      if (!val) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = kpiLeads.map((lead) => {
      return [
        escapeCsv(lead.lead_code),
        escapeCsv(lead.customer_name),
        escapeCsv(lead.mobile_number),
        escapeCsv(lead.alternate_number),
        escapeCsv(lead.email),
        escapeCsv(lead.address),
        escapeCsv(lead.city),
        escapeCsv(lead.state),
        escapeCsv(lead.pincode),
        escapeCsv(lead.solar_requirement),
        escapeCsv(lead.required_kw),
        escapeCsv(lead.interest_status),
        escapeCsv(lead.lead_source),
        escapeCsv(lead.priority),
        escapeCsv(lead.status),
        escapeCsv(lead.assigned_to_name),
        escapeCsv(formatDateTime(lead.assigned_at)),
        escapeCsv(formatDate(lead.next_follow_up_date)),
        escapeCsv(formatDate(lead.site_visit_date)),
        escapeCsv(lead.quotation_amount),
        escapeCsv(lead.remark),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSnackbar(`Exported ${kpiLeads.length} leads successfully.`);
  }, [kpiLeads, showSnackbar]);

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.priority || filters.lead_source || filters.assigned_to || filters.date_from || filters.date_to
  );

  return (
    <Box
      style={{ zoom: 0.90 }}
      sx={{ backgroundColor: COLORS.bg, minHeight: "100vh", p: 1.5, boxSizing: "border-box", width: "100%" }}
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
              Dashboard
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: COLORS.textSecondary, fontFamily: "'Inter', sans-serif" }}>
            Lead Management
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.primary, fontFamily: "'Inter', sans-serif" }}>
            All Leads
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
                All Leads Directory
              </Typography>
              <Chip
                label={`${totalCount || leads.length} Leads`}
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
              Manage enquiries, assignments, customer pipeline & quotations.
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
            {/* Segmented View Mode Toggle: Box vs Table */}
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
                { mode: "box", label: "Grid", icon: <ViewAgendaOutlinedIcon sx={{ fontSize: "1.05rem" }} /> },
                { mode: "table", label: "Table", icon: <TableRowsOutlinedIcon sx={{ fontSize: "1.05rem" }} /> },
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

            {/* Import Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<UploadFileIcon sx={{ fontSize: "1.05rem" }} />}
              onClick={() => setImportDialogOpen(true)}
              sx={{
                height: 38,
                borderRadius: "10px",
                px: 1.8,
                fontWeight: 600,
                fontSize: "0.82rem",
                textTransform: "none",
                borderColor: "#CBD5E1",
                color: COLORS.textPrimary,
                backgroundColor: "#FFFFFF",
                "&:hover": { borderColor: COLORS.accent, backgroundColor: "#F8FAFC" },
              }}
            >
              Import
            </Button>

            {/* Export CSV */}
            <Tooltip title="Export to CSV">
              <span>
                <IconButton
                  onClick={handleExportCSV}
                  disabled={kpiLoading || kpiLeads.length === 0}
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

            {/* Refresh Button */}
            <Tooltip title="Refresh leads">
              <IconButton
                onClick={handleRefresh}
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

            {/* Add Lead Button */}
            <Button
              variant="contained"
              disableElevation
              startIcon={<AddIcon sx={{ fontSize: "1.15rem" }} />}
              onClick={openCreateDialog}
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
              }}
            >
              Add Lead
            </Button>
          </Box>
        </Box>

        {/* 3. KPI CARDS - ONE SINGLE HORIZONTAL LINE ON DESKTOP */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(6, 1fr)",
            },
            gap: 1.5,
            mb: 2.5,
            width: "100%",
          }}
        >
          <KpiCard index={0} icon={<InboxIcon sx={{ fontSize: 16 }} />} label="Total Leads" value={kpis.total} accent={COLORS.primary} loading={kpiLoading} />
          <KpiCard index={1} icon={<FiberNewIcon sx={{ fontSize: 16 }} />} label="New Leads" value={kpis.newLeads} accent="#0284C7" loading={kpiLoading} />
          <KpiCard index={2} icon={<FollowupIcon sx={{ fontSize: 16 }} />} label="Follow-ups" value={kpis.followups} accent="#2563EB" loading={kpiLoading} />
          <KpiCard index={3} icon={<SiteVisitIcon sx={{ fontSize: 16 }} />} label="Site Visits" value={kpis.siteVisits} accent="#D97706" loading={kpiLoading} />
          <KpiCard index={4} icon={<WonIcon sx={{ fontSize: 16 }} />} label="Won" value={kpis.won} accent="#16A34A" loading={kpiLoading} />
          <KpiCard index={5} icon={<LostIcon sx={{ fontSize: 16 }} />} label="Lost" value={kpis.lost} accent="#DC2626" loading={kpiLoading} />
        </Box>

        {/* FILTERS */}
        <Paper elevation={0} sx={{ ...cardSx, p: 2, mb: 2.5, width: "100%", boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.2, width: "100%" }}>
            <Box sx={{ flex: "1 1 200px", minWidth: 160 }}>
              <FieldLabel>Search</FieldLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="Name, phone, city..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onBlur={handleSearchBlur}
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

            <Box sx={{ flex: "0 1 140px", minWidth: 120 }}>
              <FieldLabel>Status</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>All</MenuItem>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{s}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 120px", minWidth: 100 }}>
              <FieldLabel>Priority</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>All</MenuItem>
                {PRIORITY_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{p}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 120px", minWidth: 100 }}>
              <FieldLabel>Source</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={filters.lead_source}
                onChange={(e) => handleFilterChange("lead_source", e.target.value)}
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>All</MenuItem>
                {LEAD_SOURCE_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{s}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 180px", minWidth: 150 }}>
              <FieldLabel>Assignment Scope</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={filters.assigned_to}
                onChange={(e) => handleFilterChange("assigned_to", e.target.value)}
                sx={controlSx}
              >
                <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>
                  All Assignees (Everyone)
                </MenuItem>
                <MenuItem value="admin_assigned" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", color: COLORS.purple, fontWeight: 700 }}>
                  Admin Assigned Leads
                </MenuItem>
                <MenuItem value="manager_assigned" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", color: COLORS.primaryDark, fontWeight: 700 }}>
                  Manager Assigned Leads
                </MenuItem>
                <MenuItem value="unassigned" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", color: COLORS.warning, fontWeight: 700 }}>
                  Unassigned Leads
                </MenuItem>
                <MenuItem value="assigned" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", color: COLORS.success, fontWeight: 700 }}>
                  All Assigned Leads
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                {usersList.map((u) => {
                  const roleBadge = u.role_name || (u.role_id === 1 ? "Super Admin" : u.role_id === 2 ? "Manager" : "Sales");
                  return (
                    <MenuItem key={u.id} value={u.id} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>
                      {u.full_name} ({roleBadge})
                    </MenuItem>
                  );
                })}
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 130px", minWidth: 110 }}>
              <FieldLabel>From</FieldLabel>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange("date_from", e.target.value)}
                sx={dateControlSx}
              />
            </Box>

            <Box sx={{ flex: "0 1 130px", minWidth: 110 }}>
              <FieldLabel>To</FieldLabel>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
                sx={dateControlSx}
              />
            </Box>

            <Box sx={{ flex: "0 0 auto" }}>
              <Tooltip title="Reset Filters">
                <span>
                  <IconButton onClick={handleResetFilters} disabled={!hasActiveFilters} size="small" sx={iconSquareBtnSx}>
                    <FilterListOffIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* 4. VIEW RENDERING: BOX VIEW VS TABLE VIEW */}
        {viewMode === "box" ? (
          <Fade in timeout={300}>
            <Box sx={{ width: "100%", mb: 3 }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card
                    key={i}
                    elevation={0}
                    sx={{
                      mb: 2,
                      borderRadius: "14px",
                      border: `1px solid ${COLORS.border}`,
                      p: 2.5,
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <Skeleton variant="text" width="30%" height={28} sx={{ mb: 1.5 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}><Skeleton variant="rounded" height={120} /></Grid>
                      <Grid item xs={12} sm={4}><Skeleton variant="rounded" height={120} /></Grid>
                      <Grid item xs={12} sm={4}><Skeleton variant="rounded" height={120} /></Grid>
                    </Grid>
                  </Card>
                ))
              ) : leads.length === 0 ? (
                <Paper elevation={0} sx={{ ...cardSx, p: 4, width: "100%", boxSizing: "border-box" }}>
                  <EmptyState onAdd={openCreateDialog} />
                </Paper>
              ) : (
                leads.map((lead) => {
                  const isOverdue =
                    lead.next_follow_up_date &&
                    new Date(lead.next_follow_up_date).setHours(0, 0, 0, 0) <
                      new Date().setHours(0, 0, 0, 0) &&
                    !["Won", "Lost", "Not Interested"].includes(lead.status);
                  const isToday =
                    lead.next_follow_up_date &&
                    new Date(lead.next_follow_up_date).setHours(0, 0, 0, 0) ===
                      new Date().setHours(0, 0, 0, 0);

                  const statusColor = (STATUS_STYLES[lead.status] || {}).color || COLORS.textMuted;
                  const statusBg = (STATUS_STYLES[lead.status] || {}).bg || "#F1F5F9";

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
                        {/* Top Bar: Lead Code + Customer Name + Action Buttons */}
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
                          <Stack direction="row" spacing={1.2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
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
                            <PriorityChip priority={lead.priority} />
                            <Avatar sx={{ width: 28, height: 28, fontSize: "0.7rem", bgcolor: COLORS.primary, fontWeight: 700 }}>
                              {getInitials(lead.customer_name)}
                            </Avatar>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 800,
                                fontSize: "1.05rem",
                                color: COLORS.textPrimary,
                                fontFamily: "'Inter', sans-serif",
                              }}
                            >
                              {lead.customer_name}
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={0.8} alignItems="center">
                            {lead.mobile_number && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PhoneOutlinedIcon sx={{ fontSize: "0.95rem" }} />}
                                onClick={() => handleCall(lead.mobile_number)}
                                sx={{
                                  color: COLORS.primary,
                                  borderColor: COLORS.border,
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  borderRadius: "6px",
                                  textTransform: "none",
                                  px: 1.2,
                                  height: 30,
                                  "&:hover": { borderColor: COLORS.accent, backgroundColor: "#F0F9FF" },
                                }}
                              >
                                Call
                              </Button>
                            )}

                            {lead.mobile_number && (
                              <Tooltip title="Chat on WhatsApp">
                                <IconButton
                                  size="small"
                                  onClick={() => handleWhatsApp(lead.mobile_number)}
                                  sx={{
                                    border: "1px solid #BBF7D0",
                                    backgroundColor: "#F0FDF4",
                                    color: "#22C55E",
                                    borderRadius: "6px",
                                    p: 0.5,
                                    width: 30,
                                    height: 30,
                                    "&:hover": { backgroundColor: "#DCFCE7" },
                                  }}
                                >
                                  <WhatsAppIcon sx={{ fontSize: "1.05rem" }} />
                                </IconButton>
                              </Tooltip>
                            )}

                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => openViewDrawer(lead)}
                                sx={{
                                  border: `1px solid ${COLORS.border}`,
                                  borderRadius: "6px",
                                  p: 0.5,
                                  width: 30,
                                  height: 30,
                                  color: COLORS.accent,
                                  "&:hover": { backgroundColor: "#F0F9FF", borderColor: COLORS.accent },
                                }}
                              >
                                <ViewIcon sx={{ fontSize: "1.05rem" }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="More Actions">
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, lead)}
                                sx={{
                                  border: `1px solid ${COLORS.border}`,
                                  borderRadius: "6px",
                                  p: 0.5,
                                  width: 30,
                                  height: 30,
                                  color: COLORS.textMuted,
                                  "&:hover": { backgroundColor: "#F8FAFC" },
                                }}
                              >
                                <MoreVertIcon sx={{ fontSize: "1.05rem" }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

                        {/* Middle Info: 3-Columns Structured Boxes - 100% Full Width Equal Grid */}
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                            gap: 1.5,
                            mb: 1.8,
                            width: "100%",
                          }}
                        >
                          {/* Box 1: Pipeline & Assignment */}
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
                              <Select
                                size="small"
                                value={lead.status || "New Lead"}
                                onChange={(e) => handleStatusSelect(lead, e.target.value)}
                                variant="standard"
                                disableUnderline
                                sx={{
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  height: 24,
                                  borderRadius: "6px",
                                  px: 1,
                                  py: 0.2,
                                  color: statusColor,
                                  backgroundColor: statusBg,
                                  fontFamily: "'Inter', sans-serif",
                                  "& .MuiSelect-select": { py: "2px", pr: "20px !important" },
                                  "& .MuiSelect-icon": { color: statusColor, right: 2 },
                                }}
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <MenuItem key={s} value={s} sx={{ fontSize: "0.75rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                                    {s}
                                  </MenuItem>
                                ))}
                              </Select>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                                Lead Source:
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

                            {/* ASSIGNED BY - Distinctive Purple color matching table */}
                            {lead.assigned_by_name && (
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                                  Assigned By:
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    color: COLORS.purple,
                                    fontSize: "0.78rem",
                                    backgroundColor: COLORS.purpleSoft,
                                    px: 0.8,
                                    py: 0.2,
                                    borderRadius: "4px",
                                  }}
                                >
                                  {lead.assigned_by_name}
                                </Typography>
                              </Box>
                            )}

                            {lead.assigned_at && (
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                                  Assigned At:
                                </Typography>
                                <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.76rem" }}>
                                  {formatDate(lead.assigned_at)}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Box 2: Customer & Contact */}
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
                              Customer & Contact
                            </Typography>

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
                                Email:
                              </Typography>
                              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.78rem" }} noWrap>
                                {lead.email || "No email"}
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
                                Created:
                              </Typography>
                              <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontSize: "0.78rem" }}>
                                {formatDate(lead.created_at)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Box 3: System & Financials */}
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
                                System & Financials
                              </Typography>

                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                                  Requirement:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.82rem" }}>
                                  {lead.solar_requirement || "Residential"} · {lead.required_kw ? `${lead.required_kw} kW` : "N/A"}
                                </Typography>
                              </Box>

                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                                  Quotation:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: lead.quotation_amount ? "#16A34A" : COLORS.textMuted, fontSize: "0.82rem" }}>
                                  {lead.quotation_amount ? `₹${Number(lead.quotation_amount).toLocaleString("en-IN")}` : "Not Quoted"}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Next Follow-up Date Box */}
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
                                    color: isOverdue ? "#991B1B" : isToday ? "#15803D" : COLORS.primary,
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
                        </Box>

                        {/* Bottom: Clean Remarks Section & Inline Remark Input - Exact match to Today's Follow-up */}
                        <Box
                          sx={{
                            backgroundColor: "#F8FAFC",
                            borderRadius: "10px",
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
                              {(lead.latest_remark_date || lead.updated_at || lead.created_at) && (
                                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.74rem", fontWeight: 600 }}>
                                  {formatDateTime(lead.latest_remark_date || lead.updated_at || lead.created_at)}
                                </Typography>
                              )}
                            </Stack>

                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Button
                                size="small"
                                startIcon={<HistoryRoundedIcon sx={{ fontSize: "1rem" }} />}
                                onClick={() => handleOpenHistory(lead)}
                                sx={{
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  color: COLORS.accent,
                                  textTransform: "none",
                                  p: 0,
                                  minWidth: 0,
                                  mr: 1,
                                  "&:hover": { textDecoration: "underline", backgroundColor: "transparent" },
                                }}
                              >
                                Read more {lead.total_remarks ? `(${lead.total_remarks} remarks)` : "(History)"}
                              </Button>

                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<FollowupIcon sx={{ fontSize: 13 }} />}
                                onClick={() => openFollowupDrawer(lead)}
                                sx={{
                                  height: 28,
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  borderRadius: "6px",
                                  borderColor: "#CBD5E1",
                                  color: "#0284C7",
                                  textTransform: "none",
                                  "&:hover": { borderColor: "#0284C7", backgroundColor: "#F0F9FF" },
                                }}
                              >
                                + Follow-up
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<SiteVisitIcon sx={{ fontSize: 13 }} />}
                                onClick={() => { setSiteVisitLead(lead); setSiteVisitMode("schedule"); }}
                                sx={{
                                  height: 28,
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  borderRadius: "6px",
                                  borderColor: "#CBD5E1",
                                  color: "#D97706",
                                  textTransform: "none",
                                  "&:hover": { borderColor: "#D97706", backgroundColor: "#FFFBEB" },
                                }}
                              >
                                Site Visit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AssignIcon sx={{ fontSize: 13 }} />}
                                onClick={() => openAssignDrawer(lead)}
                                sx={{
                                  height: 28,
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  borderRadius: "6px",
                                  borderColor: "#CBD5E1",
                                  color: "#7C3AED",
                                  textTransform: "none",
                                  "&:hover": { borderColor: "#7C3AED", backgroundColor: "#FAF5FF" },
                                }}
                              >
                                Assign
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon sx={{ fontSize: 13 }} />}
                                onClick={() => openEditDialog(lead)}
                                sx={{
                                  height: 28,
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  borderRadius: "6px",
                                  borderColor: "#CBD5E1",
                                  color: COLORS.primary,
                                  textTransform: "none",
                                  "&:hover": { borderColor: COLORS.accent, backgroundColor: "#F8FAFC" },
                                }}
                              >
                                Edit
                              </Button>
                            </Stack>
                          </Box>

                          {/* Initial Remark & Latest Follow-up Note */}
                          {lead.remark && (
                            <Box sx={{ mb: lead.latest_remark ? 1 : 1.2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.3 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#64748B",
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  Initial Note:
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#64748B", fontSize: "0.7rem", fontWeight: 600 }}>
                                  {formatDateTime(lead.created_at || lead.updated_at)}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: COLORS.textPrimary,
                                  fontSize: "0.82rem",
                                  fontWeight: 500,
                                }}
                              >
                                "{lead.remark}"
                              </Typography>
                            </Box>
                          )}

                          {lead.latest_remark && (
                            <Box
                              sx={{
                                mb: 1.2,
                                p: 1,
                                px: 1.4,
                                borderRadius: "8px",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid #E2E8F0",
                                borderLeft: `3px solid ${COLORS.accent}`,
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.3,
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 0.8 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 800,
                                    fontSize: "0.68rem",
                                    color: COLORS.accent,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  Latest Follow-up Note:
                                </Typography>
                                <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.7rem", fontWeight: 500 }}>
                                  {lead.latest_remark_date ? formatDateTime(lead.latest_remark_date) : ""}
                                  {lead.latest_remark_by ? ` • By ${lead.latest_remark_by}` : ""}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: COLORS.textPrimary,
                                  fontSize: "0.82rem",
                                  fontWeight: 600,
                                }}
                              >
                                "{lead.latest_remark}"
                              </Typography>
                            </Box>
                          )}

                          {!lead.remark && !lead.latest_remark && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: COLORS.textSecondary,
                                fontStyle: "italic",
                                fontSize: "0.82rem",
                                mb: 1.2,
                              }}
                            >
                              No remarks added yet.
                            </Typography>
                          )}

                          {/* Inline Add Remark Input with Send Button */}
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
                                handleQuickAddRemark(lead.id);
                              }
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    size="small"
                                    disabled={savingRemarkLeadId === lead.id || !inlineRemarks[lead.id]?.trim()}
                                    onClick={() => handleQuickAddRemark(lead.id)}
                                    sx={{
                                      color: inlineRemarks[lead.id]?.trim() ? COLORS.accent : COLORS.textMuted,
                                      p: 0.5,
                                    }}
                                  >
                                    {savingRemarkLeadId === lead.id ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <SendRoundedIcon sx={{ fontSize: 18 }} />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                backgroundColor: "#FFFFFF",
                                borderRadius: "8px",
                                fontSize: "0.8rem",
                                height: 36,
                              },
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {/* Pagination for Box View */}
              <Paper elevation={0} sx={{ border: `1px solid ${COLORS.border}`, borderRadius: "10px", mt: 1.5, backgroundColor: "#FAFBFC" }}>
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50]}
                  component="div"
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, p) => setPage(p)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  sx={{
                    "& .MuiTablePagination-toolbar": { minHeight: 38, px: 1.5 },
                    "& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel": {
                      fontSize: "0.75rem",
                      color: COLORS.textSecondary,
                    },
                  }}
                />
              </Paper>
            </Box>
          </Fade>
        ) : (
          /* Table View */
          <Fade in timeout={300}>
            <Paper elevation={0} sx={{ ...cardSx, overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
              <TableContainer
                sx={{
                  maxHeight: 600,
                  width: "100%",
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
                <Table stickyHeader size="small" sx={{ minWidth: 1200, width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      {[
                        { label: "Code", width: "7%" },
                        { label: "Customer & Contact", width: "19%" },
                        { label: "Location", width: "10%" },
                        { label: "Requirement", width: "12%" },
                        { label: "Priority", width: "8%" },
                        { label: "Status", width: "12%" },
                        { label: "Assigned To", width: "14%" },
                        { label: "Follow-up", width: "9%" },
                        { label: "Actions", width: "9%", align: "right" },
                      ].map((head) => (
                        <TableCell
                          key={head.label}
                          align={head.align || "left"}
                          sx={{
                            backgroundColor: "#F8FAFC",
                            fontWeight: 700,
                            color: COLORS.textSecondary,
                            fontSize: "0.65rem",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                            py: 1,
                            px: 0.8,
                            width: head.width,
                            borderBottom: `2px solid ${COLORS.border}`,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {head.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 9 }).map((__, ci) => (
                            <TableCell key={ci} sx={{ py: 1, px: 0.8 }}>
                              <Skeleton variant="text" height={18} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ p: 0, border: "none" }}>
                          <EmptyState onAdd={openCreateDialog} />
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((row) => (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 0.8, px: 0.8 },
                            "&:hover td": { backgroundColor: "#FAFBFD" },
                          }}
                        >
                          {/* Code */}
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, color: COLORS.primary, fontSize: "0.75rem", fontFamily: "'Inter', sans-serif" }}>
                              {row.lead_code}
                            </Typography>
                          </TableCell>

                          {/* Customer & Phone */}
                          <TableCell>
                            <Stack direction="row" spacing={0.8} alignItems="center">
                              <Avatar sx={{ width: 24, height: 24, fontSize: "0.6rem", bgcolor: COLORS.primary, fontWeight: 600 }}>
                                {getInitials(row.customer_name)}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography noWrap sx={{ fontWeight: 600, fontSize: "0.75rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.1 }}>
                                  {row.customer_name}
                                </Typography>
                                <Typography sx={{ fontSize: "0.68rem", color: COLORS.textSecondary, fontFamily: "'Inter', sans-serif" }}>
                                  {row.mobile_number}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>

                          {/* Location */}
                          <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, whiteSpace: "nowrap" }}>
                            {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                          </TableCell>

                          {/* Requirement */}
                          <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, whiteSpace: "nowrap" }}>
                            {row.solar_requirement || "Residential"}
                            {row.required_kw ? ` · ${row.required_kw}kW` : ""}
                          </TableCell>

                          {/* Priority */}
                          <TableCell sx={{ py: 0.5 }}>
                            <PriorityChip priority={row.priority} />
                          </TableCell>

                          {/* Status */}
                          <TableCell sx={{ py: 0.5 }}>
                            <Select
                              size="small"
                              value={row.status || "New Lead"}
                              onChange={(e) => handleStatusSelect(row, e.target.value)}
                              variant="standard"
                              disableUnderline
                              sx={{
                                fontSize: "0.6875rem",
                                fontWeight: 600,
                                height: 24,
                                borderRadius: "6px",
                                px: 1,
                                py: 0.2,
                                color: (STATUS_STYLES[row.status] || {}).color || COLORS.textMuted,
                                backgroundColor: (STATUS_STYLES[row.status] || {}).bg || "#F1F2F4",
                                fontFamily: "'Inter', sans-serif",
                                "& .MuiSelect-select": { py: "2px", pr: "20px !important" },
                                "& .MuiSelect-icon": { color: (STATUS_STYLES[row.status] || {}).color || COLORS.textMuted, right: 2 },
                              }}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <MenuItem key={s} value={s} sx={{ fontSize: "0.75rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                                  {s}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>

                          {/* Assigned To & Assign Date */}
                          <TableCell sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, fontWeight: 500, whiteSpace: "nowrap" }}>
                            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.textPrimary }}>
                              {row.assigned_to_name || "Unassigned"}
                            </Typography>
                            {row.assigned_by_name && row.assigned_by_name !== row.assigned_to_name && (
                              <Typography
                                sx={{
                                  fontSize: "0.65rem",
                                  color: COLORS.purple,
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.3,
                                }}
                              >
                                <span>By:</span> {row.assigned_by_name}
                              </Typography>
                            )}
                            {row.assigned_at && (
                              <Typography
                                sx={{
                                  fontSize: "0.64rem",
                                  color: "#475569",
                                  fontWeight: 500,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.4,
                                  mt: 0.3,
                                  backgroundColor: "#F1F5F9",
                                  px: 0.6,
                                  py: 0.15,
                                  borderRadius: "4px",
                                  width: "fit-content",
                                }}
                                title={`Assigned: ${formatDateTime(row.assigned_at)}`}
                              >
                                <CalendarMonthOutlinedIcon sx={{ fontSize: 13, mr: 0.4, verticalAlign: "middle" }} /> {formatDate(row.assigned_at)}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Next Follow-up */}
                          <TableCell sx={{ fontSize: "0.7rem", color: COLORS.textMuted, whiteSpace: "nowrap" }}>
                            {formatDate(row.next_follow_up_date)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            <Stack direction="row" spacing={0.2} justifyContent="flex-end" alignItems="center">
                              <Tooltip title="View" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => openViewDrawer(row)}
                                  sx={{ width: 24, height: 24, borderRadius: "5px", color: COLORS.primary, p: 0.2 }}
                                >
                                  <ViewIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Call" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleCall(row.mobile_number)}
                                  sx={{ width: 24, height: 24, borderRadius: "5px", color: COLORS.success, p: 0.2 }}
                                >
                                  <CallIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="WhatsApp" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleWhatsApp(row.mobile_number)}
                                  sx={{ width: 24, height: 24, borderRadius: "5px", color: "#25D366", p: 0.2 }}
                                >
                                  <WhatsAppIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="More" arrow>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuOpen(e, row)}
                                  sx={{ width: 24, height: 24, borderRadius: "5px", color: COLORS.textMuted, p: 0.2 }}
                                >
                                  <MoreVertIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                sx={{
                  borderTop: `1px solid ${COLORS.border}`,
                  backgroundColor: "#FAFBFC",
                  "& .MuiTablePagination-toolbar": { minHeight: 38, px: 1.5 },
                  "& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel": {
                    fontSize: "0.75rem",
                    color: COLORS.textSecondary,
                  },
                }}
              />
            </Paper>
          </Fade>
        )}

        {/* ACTION MENU */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: "12px",
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 8px 32px rgba(15,23,42,0.12)",
              minWidth: 180,
              p: 0.5,
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            onClick={() => { if (activeLead) openEditDialog(activeLead); }}
            sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, "&:hover": { backgroundColor: COLORS.primarySoft } }}
          >
            <EditIcon sx={{ fontSize: 18, color: COLORS.primary }} /> Edit Lead
          </MenuItem>
          <MenuItem
            onClick={() => { if (activeLead) openAssignDrawer(activeLead); }}
            sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, "&:hover": { backgroundColor: COLORS.purpleSoft } }}
          >
            <AssignIcon sx={{ fontSize: 18, color: COLORS.purple }} /> Assign
          </MenuItem>
          <MenuItem
            onClick={() => { if (activeLead) openFollowupDrawer(activeLead); }}
            sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, "&:hover": { backgroundColor: "#E0F2FE" } }}
          >
            <FollowupIcon sx={{ fontSize: 18, color: "#0284C7" }} /> Add Follow-up
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          {["Won", "Lost", "Not Interested"].includes(activeLead?.status) ? (
            <MenuItem
              onClick={() => { if (activeLead) handleAdminReopen(activeLead); handleMenuClose(); }}
              sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, color: COLORS.primaryDark, "&:hover": { backgroundColor: COLORS.primarySoft } }}
            >
              <HistoryIcon sx={{ fontSize: 18, color: COLORS.primaryDark }} /> Reopen Lead
            </MenuItem>
          ) : (
            <>
              <MenuItem
                onClick={() => { if (activeLead) setWonStageLead(activeLead); handleMenuClose(); }}
                sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, color: COLORS.success, "&:hover": { backgroundColor: "#DCFCE7" } }}
              >
                <WonIcon sx={{ fontSize: 18, color: COLORS.success }} /> Mark Won
              </MenuItem>
              <MenuItem
                onClick={() => { if (activeLead) { setSiteVisitLead(activeLead); setSiteVisitMode("schedule"); } handleMenuClose(); }}
                sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, color: COLORS.purple, "&:hover": { backgroundColor: COLORS.purpleSoft } }}
              >
                <SiteVisitIcon sx={{ fontSize: 18, color: COLORS.purple }} /> Schedule Site Visit
              </MenuItem>
              <MenuItem
                onClick={() => { if (activeLead) { setSiteVisitLead(activeLead); setSiteVisitMode("complete"); } handleMenuClose(); }}
                sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, color: "#059669", "&:hover": { backgroundColor: "#D1FAE5" } }}
              >
                <SiteVisitIcon sx={{ fontSize: 18, color: "#059669" }} /> Log Visit Completed
              </MenuItem>
              <MenuItem
                onClick={() => { if (activeLead) setQuotationLead(activeLead); handleMenuClose(); }}
                sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, color: "#9333EA", "&:hover": { backgroundColor: "#F3E8FF" } }}
              >
                <MoneyIcon sx={{ fontSize: 18, color: "#9333EA" }} /> Send Quotation
              </MenuItem>
              <MenuItem
                onClick={() => { if (activeLead) setNoResponseLead(activeLead); handleMenuClose(); }}
                sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, color: "#EA580C", "&:hover": { backgroundColor: "#FFEDD5" } }}
              >
                <FollowupIcon sx={{ fontSize: 18, color: "#EA580C" }} /> Log No Response
              </MenuItem>
              <MenuItem
                onClick={() => { if (activeLead) setNotInterestedLead(activeLead); handleMenuClose(); }}
                sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, color: COLORS.danger, "&:hover": { backgroundColor: COLORS.dangerSoft } }}
              >
                <LostIcon sx={{ fontSize: 18, color: COLORS.danger }} /> Mark Not Interested
              </MenuItem>
            </>
          )}
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={() => { if (activeLead) openDeleteDialog(activeLead); }}
            sx={{ borderRadius: "8px", py: 1.2, px: 1.5, fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif", gap: 1.5, color: COLORS.danger, "&:hover": { backgroundColor: COLORS.dangerSoft } }}
          >
            <DeleteIcon sx={{ fontSize: 18, color: COLORS.danger }} /> Delete Lead
          </MenuItem>
        </Menu>

        {/* CREATE/EDIT DIALOG */}
        <Dialog
          open={formDialogOpen}
          onClose={() => { setFormDialogOpen(false); resetForm(); }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${COLORS.border}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              fontSize: "1.0625rem",
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              pb: 1.5,
              borderBottom: `1px solid ${COLORS.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {selectedLead ? "Edit Lead" : "Add New Lead"}
            <IconButton
              onClick={() => { setFormDialogOpen(false); resetForm(); }}
              size="small"
              sx={{ width: 30, height: 30, borderRadius: "8px", color: COLORS.textSecondary, backgroundColor: "#F1F5F9", "&:hover": { backgroundColor: "#E2E8F0" } }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 0, flex: 1, overflowY: "auto" }}>
            <Box sx={{ p: 3 }}>
              {/* Duplicate Lead Warning Banner */}
              {duplicateWarning && (
                <Box
                  sx={{
                    p: 2,
                    mb: 2.5,
                    borderRadius: "10px",
                    backgroundColor: COLORS.warningSoft,
                    border: `1px solid ${COLORS.warning}40`,
                    borderLeft: `4px solid ${COLORS.warning}`,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.8 }}>
                    <WarningIcon sx={{ fontSize: 20, color: COLORS.warning, flexShrink: 0 }} />
                    <Typography
                      sx={{
                        fontSize: "0.8125rem",
                        color: COLORS.warning,
                        fontWeight: 700,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Duplicate Lead Detected
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: "#92400E",
                      fontWeight: 500,
                      lineHeight: 1.6,
                      fontFamily: "'Inter', sans-serif",
                      mb: 1,
                    }}
                  >
                    This number is already linked to{" "}
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {duplicateWarning.lead_code}
                    </Box>{" "}
                    ({duplicateWarning.customer_name}) · Status:{" "}
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {duplicateWarning.status}
                    </Box>
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: "#A16207",
                      fontWeight: 500,
                      lineHeight: 1.5,
                      fontFamily: "'Inter', sans-serif",
                      fontStyle: "italic",
                    }}
                  >
                    You can still proceed — this could be a genuine case like a family member
                    or another person using the same number (e.g., husband & wife, father & son
                    sharing a contact number).
                  </Typography>
                </Box>
              )}

              {/* Duplicate Checking Spinner */}
              {duplicateChecking && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    mb: 2.5,
                    borderRadius: "10px",
                    backgroundColor: COLORS.primarySoft,
                    border: `1px solid ${COLORS.primary}30`,
                  }}
                >
                  <CircularProgress size={16} sx={{ color: COLORS.primary }} />
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: COLORS.primary,
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Checking for duplicate lead...
                  </Typography>
                </Box>
              )}

              <Grid container spacing={2}>
                {/* --- 1. Customer Name * --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Customer Name *</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Full name"
                    value={formData.customer_name}
                    onChange={(e) => handleFormFieldChange("customer_name", e.target.value)}
                    error={Boolean(formErrors.customer_name)}
                    helperText={formErrors.customer_name}
                    sx={controlSx}
                  />
                </Grid>

                {/* --- 2. Mobile Number * --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Mobile Number *</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="10-digit number"
                    value={formData.mobile_number}
                    onChange={(e) => handleFormFieldChange("mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onBlur={handleMobileBlur}
                    error={Boolean(formErrors.mobile_number)}
                    helperText={formErrors.mobile_number}
                    sx={controlSx}
                    InputProps={{
                      endAdornment: duplicateChecking ? (
                        <InputAdornment position="end">
                          <CircularProgress size={16} />
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                </Grid>

                {/* --- 3. Required kW --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Required kW</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 5"
                    type="number"
                    value={formData.required_kw}
                    onChange={(e) => handleFormFieldChange("required_kw", e.target.value)}
                    error={Boolean(formErrors.required_kw)}
                    helperText={formErrors.required_kw}
                    sx={controlSx}
                  />
                </Grid>

                {/* --- 4. Assign To --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Assign To</FieldLabel>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.assigned_to || ""}
                    onChange={(e) => handleFormFieldChange("assigned_to", e.target.value)}
                    sx={controlSx}
                  >
                    <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>
                      <em>Unassigned</em>
                    </MenuItem>
                    {usersList.map((user) => (
                      <MenuItem
                        key={user.id}
                        value={user.id}
                        sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}
                      >
                        {user.full_name} ({user.role_name || (user.role_id === 2 ? "Manager" : "Sales")})
                      </MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* --- 5. State (Default: Rajasthan) --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>State</FieldLabel>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.state}
                    onChange={handleStateChange}
                    sx={controlSx}
                  >
                    <MenuItem value="" sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem" }}>Select State</MenuItem>
                    {indianStates.map((s) => (
                      <MenuItem key={s.isoCode} value={s.name} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* --- 6. City (Default: Jaipur) --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>City</FieldLabel>
                  <Select
                    fullWidth
                    displayEmpty
                    size="small"
                    value={formData.city}
                    onChange={handleCityChange}
                    disabled={!formData.state}
                    sx={controlSx}
                  >
                    <MenuItem value="" sx={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem" }}>
                      {formData.state ? "Select City" : "Select state first"}
                    </MenuItem>
                    {cityOptions.map((c) => (
                      <MenuItem key={c.name} value={c.name} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* --- 7. Alternate Number & Email --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Alternate Number</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Optional"
                    value={formData.alternate_number}
                    onChange={(e) => handleFormFieldChange("alternate_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Email</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Optional"
                    value={formData.email}
                    onChange={(e) => handleFormFieldChange("email", e.target.value)}
                    error={Boolean(formErrors.email)}
                    helperText={formErrors.email}
                    sx={controlSx}
                  />
                </Grid>

                {/* --- 8. Address & Pincode --- */}
                <Grid item xs={12} sm={8}>
                  <FieldLabel>Address</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Full address"
                    value={formData.address}
                    onChange={(e) => handleFormFieldChange("address", e.target.value)}
                    sx={controlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Pincode</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={(e) => handleFormFieldChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    sx={controlSx}
                  />
                </Grid>

                {/* --- 9. Solar Specs & Source --- */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Solar Requirement</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.solar_requirement}
                    onChange={(e) => handleFormFieldChange("solar_requirement", e.target.value)}
                    sx={controlSx}
                  >
                    {SOLAR_REQUIREMENT_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>{s}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Interest Status</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.interest_status}
                    onChange={(e) => handleFormFieldChange("interest_status", e.target.value)}
                    sx={controlSx}
                  >
                    {INTEREST_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>{s}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Lead Source</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.lead_source}
                    onChange={(e) => handleFormFieldChange("lead_source", e.target.value)}
                    sx={controlSx}
                  >
                    {LEAD_SOURCE_OPTIONS.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>{s}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {/* --- 10. Priority & Pipeline Status / Quotation --- */}
                <Grid item xs={12} sm={4}>
                  <FieldLabel>Priority</FieldLabel>
                  <Select
                    fullWidth
                    size="small"
                    value={formData.priority}
                    onChange={(e) => handleFormFieldChange("priority", e.target.value)}
                    sx={controlSx}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <MenuItem key={p} value={p} sx={{ fontSize: "0.8125rem" }}>{p}</MenuItem>
                    ))}
                  </Select>
                </Grid>

                {!selectedLead ? (
                  <Grid item xs={12} sm={4}>
                    <FieldLabel>Status</FieldLabel>
                    <Select
                      fullWidth
                      size="small"
                      value={formData.status}
                      onChange={(e) => handleFormFieldChange("status", e.target.value)}
                      sx={controlSx}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem" }}>{s}</MenuItem>
                      ))}
                    </Select>
                  </Grid>
                ) : (
                  <Grid item xs={12} sm={4} />
                )}

                <Grid item xs={12} sm={4}>
                  <FieldLabel>Quotation Amount (₹)</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 250000"
                    type="number"
                    value={formData.quotation_amount}
                    onChange={(e) => handleFormFieldChange("quotation_amount", e.target.value)}
                    sx={controlSx}
                  />
                </Grid>

                {/* --- 11. Dates --- */}
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Next Follow-up Date</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={formData.next_follow_up_date}
                    onChange={(e) => handleFormFieldChange("next_follow_up_date", e.target.value)}
                    sx={dateControlSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel>Site Visit Date</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={formData.site_visit_date}
                    onChange={(e) => handleFormFieldChange("site_visit_date", e.target.value)}
                    sx={dateControlSx}
                  />
                </Grid>

                {/* --- 12. Remark --- */}
                <Grid item xs={12}>
                  <FieldLabel>Remark</FieldLabel>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Any notes..."
                    multiline
                    minRows={2}
                    maxRows={4}
                    value={formData.remark}
                    onChange={(e) => handleFormFieldChange("remark", e.target.value)}
                    error={Boolean(formErrors.remark)}
                    helperText={formErrors.remark}
                    sx={controlSx}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              py: 2,
              borderTop: `1px solid ${COLORS.border}`,
              backgroundColor: "#FAFBFC",
              gap: 1,
            }}
          >
            <Button
              onClick={() => { setFormDialogOpen(false); resetForm(); }}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                px: 3,
                fontSize: "0.875rem",
                color: COLORS.textSecondary,
                "&:hover": { backgroundColor: "#F1F5F9" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleFormSubmit}
              disabled={saving || duplicateChecking}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                px: 3,
                fontSize: "0.875rem",
                backgroundColor: COLORS.primary,
                "&:hover": { backgroundColor: COLORS.primaryDark },
                "&.Mui-disabled": { backgroundColor: COLORS.border, color: COLORS.textMuted },
              }}
            >
              {saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : selectedLead ? (
                "Update Lead"
              ) : (
                "Create Lead"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* VIEW DRAWER */}
        <Drawer
          anchor="right"
          open={viewDrawerOpen}
          onClose={() => setViewDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: 480,
              maxWidth: "100vw",
              backgroundColor: COLORS.card,
              borderLeft: `1px solid ${COLORS.border}`,
            },
          }}
        >
          <SlideTransition in={viewDrawerOpen}>
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Box sx={{ p: 2.5, borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: COLORS.textPrimary, fontFamily: "'Inter', sans-serif" }}>
                  Lead Details
                </Typography>
                <IconButton
                  onClick={() => setViewDrawerOpen(false)}
                  sx={{ width: 32, height: 32, borderRadius: "8px", color: COLORS.textSecondary, backgroundColor: "#F1F5F9", "&:hover": { backgroundColor: "#E2E8F0" } }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
                {viewLoading ? (
                  <Stack spacing={2}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: "8px" }} />
                    ))}
                  </Stack>
                ) : viewLead ? (
                  <Stack spacing={2.5}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                      <Avatar sx={{ width: 48, height: 48, fontSize: "1rem", bgcolor: COLORS.primaryDark, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
                        {getInitials(viewLead.customer_name)}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", fontFamily: "'Inter', sans-serif", color: COLORS.textPrimary }}>
                          {viewLead.customer_name}
                        </Typography>
                        <Typography sx={{ fontSize: "0.8125rem", color: COLORS.primary, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                          {viewLead.lead_code}
                        </Typography>
                      </Box>
                      <Select
                        size="small"
                        value={viewLead.status || "New Lead"}
                        onChange={(e) => handleStatusSelect(viewLead, e.target.value)}
                        variant="standard"
                        disableUnderline
                        sx={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          height: 26,
                          borderRadius: "6px",
                          px: 1.2,
                          color: (STATUS_STYLES[viewLead.status] || {}).color || COLORS.textMuted,
                          backgroundColor: (STATUS_STYLES[viewLead.status] || {}).bg || "#F1F2F4",
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          "& .MuiSelect-select": { py: "2px", pr: "20px !important" },
                          "& .MuiSelect-icon": { color: (STATUS_STYLES[viewLead.status] || {}).color || COLORS.textMuted, right: 2 },
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <MenuItem key={s} value={s} sx={{ fontSize: "0.75rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                            {s}
                          </MenuItem>
                        ))}
                      </Select>
                    </Box>

                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      <Button size="small" startIcon={<CallIcon sx={{ fontSize: 14 }} />} onClick={() => handleCall(viewLead.mobile_number)} sx={outlinedButtonSx}>
                        Call
                      </Button>
                      <Button size="small" startIcon={<WhatsAppIcon sx={{ fontSize: 14 }} />} onClick={() => handleWhatsApp(viewLead.mobile_number)} sx={{ ...outlinedButtonSx, color: "#25D366", borderColor: "#25D36640" }}>
                        WhatsApp
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                        onClick={() => { setViewDrawerOpen(false); openEditDialog(viewLead); }}
                        sx={outlinedButtonSx}
                      >
                        Edit
                      </Button>
                      {["Won", "Lost", "Not Interested"].includes(viewLead.status) ? (
                        <Button
                          size="small"
                          startIcon={<HistoryIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleAdminReopen(viewLead)}
                          sx={{ ...outlinedButtonSx, color: COLORS.primaryDark, borderColor: COLORS.primaryDark, fontWeight: 700 }}
                        >
                          Reopen Lead
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="small"
                            startIcon={<WonIcon sx={{ fontSize: 14 }} />}
                            onClick={() => setWonStageLead(viewLead)}
                            sx={{ ...outlinedButtonSx, color: COLORS.success, borderColor: COLORS.success, fontWeight: 700 }}
                          >
                            Mark Won
                          </Button>
                          <Button
                            size="small"
                            startIcon={<SiteVisitIcon sx={{ fontSize: 14 }} />}
                            onClick={() => { setSiteVisitLead(viewLead); setSiteVisitMode("schedule"); }}
                            sx={{ ...outlinedButtonSx, color: COLORS.purple, borderColor: COLORS.purple, fontWeight: 600 }}
                          >
                            Site Visit
                          </Button>
                          <Button
                            size="small"
                            startIcon={<MoneyIcon sx={{ fontSize: 14 }} />}
                            onClick={() => setQuotationLead(viewLead)}
                            sx={{ ...outlinedButtonSx, color: "#9333EA", borderColor: "#9333EA", fontWeight: 600 }}
                          >
                            Quotation
                          </Button>
                          <Button
                            size="small"
                            startIcon={<FollowupIcon sx={{ fontSize: 14 }} />}
                            onClick={() => setNoResponseLead(viewLead)}
                            sx={{ ...outlinedButtonSx, color: "#EA580C", borderColor: "#EA580C", fontWeight: 600 }}
                          >
                            No Response
                          </Button>
                          <Button
                            size="small"
                            startIcon={<LostIcon sx={{ fontSize: 14 }} />}
                            onClick={() => setNotInterestedLead(viewLead)}
                            sx={{ ...outlinedButtonSx, color: COLORS.danger, borderColor: COLORS.danger, fontWeight: 700 }}
                          >
                            Not Interested
                          </Button>
                        </>
                      )}
                    </Stack>

                    <Tabs
                      value={viewDrawerTab}
                      onChange={(_, val) => setViewDrawerTab(val)}
                      sx={{
                        borderBottom: `1px solid ${COLORS.border}`,
                        minHeight: 38,
                        "& .MuiTab-root": {
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          textTransform: "none",
                          minHeight: 38,
                          px: 1.5,
                        },
                        "& .Mui-selected": { color: COLORS.primary },
                        "& .MuiTabs-indicator": { backgroundColor: COLORS.primary },
                      }}
                    >
                      <Tab label="Overview" />
                      <Tab label={`Activity (${viewFollowups.length + viewLogs.length})`} />
                      <Tab label="Audit History" />
                    </Tabs>

                    {viewDrawerTab === 0 && (
                      <>
                        <DetailSectionCard title="Customer Information" icon>
                          <InfoRow icon={<PersonIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Name" value={viewLead.customer_name} />
                          <InfoRow icon={<PhoneIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Mobile" value={viewLead.mobile_number} valueColor={COLORS.success} />
                          <InfoRow icon={<PhoneIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Alternate" value={viewLead.alternate_number} />
                          <InfoRow icon={<EmailIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Email" value={viewLead.email} />
                          <InfoRow icon={<LocationIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Address" value={`${viewLead.address || ""}${viewLead.city ? `, ${viewLead.city}` : ""}${viewLead.state ? `, ${viewLead.state}` : ""}${viewLead.pincode ? ` - ${viewLead.pincode}` : ""}`} />
                        </DetailSectionCard>

                        <DetailSectionCard title="Solar Requirement" icon>
                          <InfoRow icon={<SolarIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Type" value={viewLead.solar_requirement} />
                          <InfoRow icon={<SolarIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Required kW" value={viewLead.required_kw ? `${viewLead.required_kw} kW` : "—"} />
                          <InfoRow icon={<MoneyIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Quotation" value={formatCurrency(viewLead.quotation_amount)} valueColor={COLORS.success} />
                          {viewLead.deal_amount && (
                            <InfoRow icon={<MoneyIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Final Deal Amount" value={formatCurrency(viewLead.deal_amount)} valueColor={COLORS.success} />
                          )}
                          {viewLead.payment_status && (
                            <InfoRow icon={<MoneyIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Payment Status" value={viewLead.payment_status} />
                          )}
                        </DetailSectionCard>

                        <DetailSectionCard title="Assignment & Ownership" icon>
                          <InfoRow icon={<PersonIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Assigned To" value={viewLead.assigned_to_name || "Unassigned"} />
                          <InfoRow icon={<PersonIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Assigned By" value={viewLead.assigned_by_name || "—"} />
                          <InfoRow icon={<CalendarIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Assign Date" value={formatDateTime(viewLead.assigned_at)} />
                          <InfoRow icon={<PersonIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Created By" value={viewLead.created_by_name || "—"} />
                        </DetailSectionCard>

                        <DetailSectionCard title="Lead Details" icon>
                          <InfoRow icon={<HistoryIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Source" value={viewLead.lead_source} />
                          <InfoRow icon={<CalendarIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Follow-up" value={formatDate(viewLead.next_follow_up_date)} valueColor={COLORS.warning} />
                          <InfoRow icon={<SiteVisitIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Site Visit" value={formatDate(viewLead.site_visit_date)} />
                          {viewLead.reason_category && (
                            <InfoRow icon={<NotesIcon sx={{ fontSize: 16, color: COLORS.danger }} />} label="Reason Category" value={viewLead.reason_category} valueColor={COLORS.danger} />
                          )}
                          <InfoRow icon={<NotesIcon sx={{ fontSize: 16, color: COLORS.primary }} />} label="Remark" value={viewLead.remark} />
                        </DetailSectionCard>
                      </>
                    )}

                    {viewDrawerTab === 1 && (
                      <>
                        {viewFollowups.length > 0 && (
                          <DetailSectionCard title={`Follow-ups (${viewFollowups.length})`} icon>
                            <List disablePadding>
                              {viewFollowups.map((fp, idx) => (
                                <ListItem key={fp.id || idx} sx={{ px: 0, py: 0.8, borderBottom: idx < viewFollowups.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                                  <ListItemAvatar sx={{ minWidth: 36 }}>
                                    <Avatar sx={{ width: 28, height: 28, fontSize: "0.65rem", bgcolor: COLORS.primarySoft, color: COLORS.primary }}>
                                      {fp.followup_type?.[0] || "F"}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={fp.note}
                                    secondary={`${fp.followup_type || "Note"} · ${formatDate(fp.follow_up_date || fp.created_at)}`}
                                    primaryTypographyProps={{ fontSize: "0.8125rem", fontWeight: 500, fontFamily: "'Inter', sans-serif", color: COLORS.textPrimary }}
                                    secondaryTypographyProps={{ fontSize: "0.6875rem", fontFamily: "'Inter', sans-serif", color: COLORS.textMuted, mt: 0.3 }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </DetailSectionCard>
                        )}

                        {viewLogs.length > 0 && (
                          <DetailSectionCard title={`Activity Log (${viewLogs.length})`} icon>
                            {viewLogs.slice(0, 10).map((log, idx) => (
                              <ActivityLogItem key={log.id || idx} log={log} index={idx} />
                            ))}
                          </DetailSectionCard>
                        )}

                        {viewFollowups.length === 0 && viewLogs.length === 0 && (
                          <Typography sx={{ textAlign: "center", color: COLORS.textMuted, py: 4, fontSize: "0.85rem" }}>
                            No follow-ups or activity logs recorded yet.
                          </Typography>
                        )}
                      </>
                    )}

                    {viewDrawerTab === 2 && (
                      <AuditHistoryTab leadId={viewLead?.id} />
                    )}
                  </Stack>
                ) : (
                  <Typography sx={{ textAlign: "center", color: COLORS.textMuted, py: 4, fontFamily: "'Inter', sans-serif" }}>
                    Unable to load lead details.
                  </Typography>
                )}
              </Box>
            </Box>
          </SlideTransition>
        </Drawer>

        {/* ASSIGN DRAWER */}
        <Drawer
          anchor="right"
          open={assignDrawerOpen}
          onClose={() => setAssignDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: 380,
              maxWidth: "100vw",
              backgroundColor: COLORS.card,
              borderLeft: `1px solid ${COLORS.border}`,
            },
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: COLORS.textPrimary, fontFamily: "'Inter', sans-serif" }}>
                Assign Lead
              </Typography>
              <IconButton
                onClick={() => setAssignDrawerOpen(false)}
                sx={{ width: 32, height: 32, borderRadius: "8px", color: COLORS.textSecondary, backgroundColor: "#F1F5F9", "&:hover": { backgroundColor: "#E2E8F0" } }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            {activeLead && (
              <Box sx={{ p: 2, backgroundColor: COLORS.bg, borderRadius: "10px", mb: 3, border: `1px solid ${COLORS.border}` }}>
                <Typography sx={{ fontSize: "0.6875rem", color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", mb: 0.5, fontFamily: "'Inter', sans-serif" }}>Lead</Typography>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                  {activeLead.customer_name} ({activeLead.lead_code})
                </Typography>
              </Box>
            )}
            <Autocomplete
              options={usersList}
              getOptionLabel={(o) => o.full_name || ""}
              value={assignedToUser}
              onChange={(e, v) => setAssignedToUser(v)}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              renderInput={(p) => (
                <TextField {...p} label="Select User" size="small" sx={controlSx} />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5, px: 0.5 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: "0.7rem", bgcolor: COLORS.primaryDark, fontFamily: "'Inter', sans-serif" }}>
                        {getInitials(option.full_name)}
                      </Avatar>
                      <Typography sx={{ fontWeight: 500, fontSize: "0.875rem", fontFamily: "'Inter', sans-serif" }}>{option.full_name}</Typography>
                    </Stack>
                  </li>
                );
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleAssignSubmit}
              disabled={assigning || !assignedToUser}
              sx={{
                mt: 3,
                height: 42,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                backgroundColor: COLORS.primary,
                fontFamily: "'Inter', sans-serif",
                "&:hover": { backgroundColor: COLORS.primaryDark },
                "&.Mui-disabled": { backgroundColor: COLORS.border, color: COLORS.textMuted },
              }}
            >
              {assigning ? <CircularProgress size={20} color="inherit" /> : "Confirm Assign"}
            </Button>
          </Box>
        </Drawer>

        {/* FOLLOW-UP DRAWER */}
        <Drawer
          anchor="right"
          open={followupDrawerOpen}
          onClose={() => setFollowupDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: 420,
              maxWidth: "100vw",
              backgroundColor: COLORS.card,
              borderLeft: `1px solid ${COLORS.border}`,
            },
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: COLORS.textPrimary, fontFamily: "'Inter', sans-serif" }}>
                Add Follow-up
              </Typography>
              <IconButton
                onClick={() => setFollowupDrawerOpen(false)}
                sx={{ width: 32, height: 32, borderRadius: "8px", color: COLORS.textSecondary, backgroundColor: "#F1F5F9", "&:hover": { backgroundColor: "#E2E8F0" } }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            {activeLead && (
              <Box sx={{ p: 2, backgroundColor: COLORS.bg, borderRadius: "10px", mb: 3, border: `1px solid ${COLORS.border}` }}>
                <Typography sx={{ fontSize: "0.6875rem", color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", mb: 0.5, fontFamily: "'Inter', sans-serif" }}>Lead</Typography>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                  {activeLead.customer_name} ({activeLead.lead_code})
                </Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <FieldLabel>Type</FieldLabel>
                <Select
                  fullWidth
                  size="small"
                  value={followupData.followup_type}
                  onChange={(e) => setFollowupData((p) => ({ ...p, followup_type: e.target.value }))}
                  sx={controlSx}
                >
                  {FOLLOWUP_TYPE_OPTIONS.map((t) => (
                    <MenuItem key={t} value={t} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{t}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Box>
                <FieldLabel>Note *</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="What was discussed?"
                  multiline
                  minRows={3}
                  maxRows={6}
                  value={followupData.note}
                  onChange={(e) => setFollowupData((p) => ({ ...p, note: e.target.value }))}
                  sx={controlSx}
                />
              </Box>
              <Box>
                <FieldLabel>Next Follow-up Date</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={followupData.next_follow_up_date}
                  onChange={(e) => setFollowupData((p) => ({ ...p, next_follow_up_date: e.target.value }))}
                  sx={dateControlSx}
                />
              </Box>
              <Box>
                <FieldLabel>Status After Follow-up</FieldLabel>
                <Select
                  fullWidth
                  displayEmpty
                  size="small"
                  value={followupData.status_after_followup}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      setFollowupDrawerOpen(false);
                      handleStatusSelect(activeLead, val);
                    } else {
                      setFollowupData((p) => ({ ...p, status_after_followup: "" }));
                    }
                  }}
                  sx={controlSx}
                >
                  <MenuItem value="" sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>No change</MenuItem>
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: "0.8125rem", fontFamily: "'Inter', sans-serif" }}>{s}</MenuItem>
                  ))}
                </Select>
              </Box>
              <Button
                fullWidth
                variant="contained"
                onClick={handleFollowupSubmit}
                disabled={followupSaving || !followupData.note.trim()}
                sx={{
                  mt: 1,
                  height: 42,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  backgroundColor: COLORS.primary,
                  fontFamily: "'Inter', sans-serif",
                  "&:hover": { backgroundColor: COLORS.primaryDark },
                  "&.Mui-disabled": { backgroundColor: COLORS.border, color: COLORS.textMuted },
                }}
              >
                {followupSaving ? <CircularProgress size={20} color="inherit" /> : "Save Follow-up"}
              </Button>
            </Box>
          </Box>
        </Drawer>

        {/* DELETE CONFIRM DIALOG */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              border: `1px solid ${COLORS.border}`,
              p: 1,
            },
          }}
        >
          <Box sx={{ p: 2.5, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "14px",
                backgroundColor: COLORS.dangerSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.danger,
                mx: "auto",
                mb: 2,
              }}
            >
              <DeleteIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.0625rem", mb: 0.8, fontFamily: "'Inter', sans-serif", color: COLORS.textPrimary }}>
              Delete Lead?
            </Typography>
            <Typography sx={{ fontSize: "0.875rem", color: COLORS.textSecondary, mb: 3, fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
              {activeLead
                ? `This will permanently delete "${activeLead.customer_name}" (${activeLead.lead_code}). This action cannot be undone.`
                : "This action cannot be undone."}
            </Typography>
            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "10px",
                  px: 3,
                  fontSize: "0.875rem",
                  color: COLORS.textSecondary,
                  fontFamily: "'Inter', sans-serif",
                  "&:hover": { backgroundColor: "#F1F5F9" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "10px",
                  px: 3,
                  fontSize: "0.875rem",
                  backgroundColor: COLORS.danger,
                  fontFamily: "'Inter', sans-serif",
                  "&:hover": { backgroundColor: "#B91C1C" },
                  "&.Mui-disabled": { backgroundColor: COLORS.border, color: COLORS.textMuted },
                }}
              >
                {deleting ? <CircularProgress size={20} color="inherit" /> : "Yes, Delete"}
              </Button>
            </Stack>
          </Box>
        </Dialog>

        {/* IMPORT LEADS DIALOG */}
        <ImportLeadsDialog
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImportComplete={() => {
            fetchLeadsList();
            fetchKpiSnapshot();
          }}
          showSnackbar={showSnackbar}
        />

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <MuiAlert
            onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
            severity={snackbar.severity}
            variant="filled"
            sx={{
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.875rem",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {snackbar.message}
          </MuiAlert>
        </Snackbar>

        {/* NOT INTERESTED MODAL */}
        <NotInterestedModal
          open={Boolean(notInterestedLead)}
          onClose={() => setNotInterestedLead(null)}
          lead={notInterestedLead}
          onSuccess={async () => {
            showSnackbar("Lead marked as Not Interested with verified reason.");
            if (viewDrawerOpen && viewLead?.id === notInterestedLead?.id) {
              const res = await getLeadById(notInterestedLead.id).catch(() => null);
              if (res?.data) setViewLead(res.data);
            }
            fetchLeadsList();
            fetchKpiSnapshot();
          }}
        />

        {/* WON STAGE MODAL */}
        <WonStageModal
          open={Boolean(wonStageLead)}
          onClose={() => setWonStageLead(null)}
          lead={wonStageLead}
          onSuccess={async () => {
            showSnackbar("Lead marked as Won successfully!");
            if (viewDrawerOpen && viewLead?.id === wonStageLead?.id) {
              const res = await getLeadById(wonStageLead.id).catch(() => null);
              if (res?.data) setViewLead(res.data);
            }
            fetchLeadsList();
            fetchKpiSnapshot();
          }}
        />

        {/* REMARKS TIMELINE HISTORY MODAL */}
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

      {/* SITE VISIT MODAL */}
        <SiteVisitModal
          open={Boolean(siteVisitLead)}
          onClose={() => setSiteVisitLead(null)}
          lead={siteVisitLead}
          mode={siteVisitMode}
          onSuccess={async () => {
            showSnackbar(siteVisitMode === "schedule" ? "Site visit scheduled successfully!" : "Site visit completion logged!");
            if (viewDrawerOpen && viewLead?.id === siteVisitLead?.id) {
              const res = await getLeadById(siteVisitLead.id).catch(() => null);
              if (res?.data) setViewLead(res.data);
            }
            fetchLeadsList();
            fetchKpiSnapshot();
          }}
        />

        {/* QUOTATION MODAL */}
        <QuotationModal
          open={Boolean(quotationLead)}
          onClose={() => setQuotationLead(null)}
          lead={quotationLead}
          onSuccess={async () => {
            showSnackbar("Quotation saved and next follow-up scheduled!");
            if (viewDrawerOpen && viewLead?.id === quotationLead?.id) {
              const res = await getLeadById(quotationLead.id).catch(() => null);
              if (res?.data) setViewLead(res.data);
            }
            fetchLeadsList();
            fetchKpiSnapshot();
          }}
        />

        {/* NO RESPONSE MODAL */}
        <NoResponseModal
          open={Boolean(noResponseLead)}
          onClose={() => setNoResponseLead(null)}
          lead={noResponseLead}
          onSuccess={async () => {
            showSnackbar("No Response attempt logged successfully!");
            if (viewDrawerOpen && viewLead?.id === noResponseLead?.id) {
              const res = await getLeadById(noResponseLead.id).catch(() => null);
              if (res?.data) setViewLead(res.data);
            }
            fetchLeadsList();
            fetchKpiSnapshot();
          }}
        />

        {/* FOLLOW UP DATE MODAL */}
        <FollowUpDateModal
          open={Boolean(followUpDateLead)}
          onClose={() => setFollowUpDateLead(null)}
          lead={followUpDateLead}
          targetStatus={targetFollowUpStatus}
          onSuccess={async () => {
            showSnackbar(`Status updated to ${targetFollowUpStatus} with follow-up date!`);
            if (viewDrawerOpen && viewLead?.id === followUpDateLead?.id) {
              const res = await getLeadById(followUpDateLead.id).catch(() => null);
              if (res?.data) setViewLead(res.data);
            }
            fetchLeadsList();
            fetchKpiSnapshot();
          }}
        />
      </Box>
    </Box>
  );
}