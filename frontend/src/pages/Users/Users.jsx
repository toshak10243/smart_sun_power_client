// ======================================================
// 1. IMPORTS & DEPENDENCIES
// ======================================================
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  Switch,
  CircularProgress,
  Snackbar,
  Alert,
  Breadcrumbs,
  Stack,
  Select,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

// Material UI Vector SVG Icons (Strictly 0 unicode emojis)
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterListOffIcon from "@mui/icons-material/FilterListOff";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

// Services (API Layer)
import {
  getUsers,
  getUserStats,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
} from "../../services/userServices";
import { useAuth } from "../../context/AuthContext";

// ======================================================
// 2. CONSTANTS & DESIGN SYSTEM
// ======================================================
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;
const ROLE_BO_ONLINE = 4;
const ROLE_BO_FIELD = 5;
const ROLE_LOAN = 6;
const ROLE_ACCOUNTS = 7;
const ROLE_INSTALL = 8;
const ROLE_PORTAL = 9;

const STATUS_ACTIVE = "Active";
const STATUS_INACTIVE = "Inactive";

const COLORS = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  primarySoft: "#E6F0FA",
  accent: "#38BDF8",
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
  purple: "#9333EA",
  purpleSoft: "#F3E8FF",
  indigo: "#4F46E5",
  indigoSoft: "#EEF2FF",
};

const cardSx = {
  borderRadius: "12px",
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.card,
  boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
};

const primaryButtonSx = {
  height: 36,
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 700,
  fontSize: "0.8rem",
  px: 2,
  backgroundColor: COLORS.primary,
  color: "#FFFFFF",
  whiteSpace: "nowrap",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: COLORS.primaryDark,
    boxShadow: "0 2px 8px rgba(0,91,172,0.25)",
  },
};

const outlinedButtonSx = {
  height: 36,
  borderRadius: "8px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.8rem",
  px: 1.8,
  borderColor: COLORS.border,
  backgroundColor: COLORS.card,
  color: COLORS.textPrimary,
  whiteSpace: "nowrap",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F1F5F9" },
};

const iconSquareBtnSx = {
  width: 36,
  height: 36,
  borderRadius: "8px",
  border: `1px solid ${COLORS.border}`,
  color: COLORS.primary,
  backgroundColor: "#FFFFFF",
  "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F1F5F9" },
};

const controlSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: COLORS.card,
    height: "36px",
    fontSize: "0.78rem",
    color: COLORS.textPrimary,
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
  },
  "& .MuiSelect-select": { display: "flex", alignItems: "center", fontSize: "0.78rem" },
};

const dialogControlSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#F8FAFC",
    fontSize: "0.82rem",
    color: COLORS.textPrimary,
    "& fieldset": { borderColor: COLORS.border },
    "&:hover fieldset": { borderColor: COLORS.borderStrong },
    "&.Mui-focused": { backgroundColor: "#FFFFFF" },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "1.5px" },
    "& .MuiOutlinedInput-input": {
      color: COLORS.textPrimary,
      WebkitTextFillColor: COLORS.textPrimary,
    },
  },
};

const FieldLabel = ({ children, required }) => (
  <Typography
    sx={{
      fontSize: "0.7rem",
      fontWeight: 700,
      color: COLORS.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      mb: 0.5,
    }}
  >
    {children} {required && <Box component="span" sx={{ color: COLORS.danger }}>*</Box>}
  </Typography>
);

const getRoleChipConfig = (roleId, roleName) => {
  const id = Number(roleId);
  if (id === ROLE_SUPER_ADMIN) {
    return { label: roleName || "Super Admin", bg: COLORS.primarySoft, color: COLORS.primaryDark };
  }
  if (id === ROLE_MANAGER) {
    return { label: roleName || "Manager", bg: COLORS.warningSoft, color: COLORS.warning };
  }
  if (id === ROLE_BO_ONLINE) {
    return { label: roleName || "Back Office Online", bg: "#E0F2FE", color: "#0369A1" };
  }
  if (id === ROLE_BO_FIELD) {
    return { label: roleName || "Back Office Field", bg: "#FFE4E6", color: "#BE123C" };
  }
  if (id === ROLE_LOAN) {
    return { label: roleName || "Loan Officer", bg: "#EDE9FE", color: "#6D28D9" };
  }
  if (id === ROLE_ACCOUNTS) {
    return { label: roleName || "Accounts", bg: "#DCFCE7", color: "#15803D" };
  }
  if (id === ROLE_INSTALL) {
    return { label: roleName || "Installation Lead", bg: "#FEF3C7", color: "#B45309" };
  }
  if (id === ROLE_PORTAL) {
    return { label: roleName || "Portal Entry", bg: "#F3E8FF", color: "#7E22CE" };
  }
  return { label: roleName || "Sales", bg: COLORS.successSoft, color: COLORS.success };
};

const getRoleChipByName = (roleName) => {
  const label = roleName || "Unassigned";
  const nameLower = label.toLowerCase();
  if (nameLower.includes("admin")) return { label, bg: COLORS.primarySoft, color: COLORS.primaryDark };
  if (nameLower.includes("manager")) return { label, bg: COLORS.warningSoft, color: COLORS.warning };
  if (nameLower.includes("online")) return { label, bg: "#E0F2FE", color: "#0369A1" };
  if (nameLower.includes("field")) return { label, bg: "#FFE4E6", color: "#BE123C" };
  if (nameLower.includes("loan")) return { label, bg: "#EDE9FE", color: "#6D28D9" };
  if (nameLower.includes("accounts")) return { label, bg: "#DCFCE7", color: "#15803D" };
  if (nameLower.includes("installation")) return { label, bg: "#FEF3C7", color: "#B45309" };
  if (nameLower.includes("portal")) return { label, bg: "#F3E8FF", color: "#7E22CE" };
  return { label, bg: COLORS.successSoft, color: COLORS.success };
};

const getRoleLabel = (roleId) => {
  const id = Number(roleId);
  if (id === ROLE_SUPER_ADMIN) return "Super Admin";
  if (id === ROLE_MANAGER) return "Manager";
  if (id === ROLE_BO_ONLINE) return "Back Office Online";
  if (id === ROLE_BO_FIELD) return "Back Office Field";
  if (id === ROLE_LOAN) return "Loan Officer";
  if (id === ROLE_ACCOUNTS) return "Accounts Officer";
  if (id === ROLE_INSTALL) return "Installation Lead";
  if (id === ROLE_PORTAL) return "Portal Entry";
  return "Sales Representative";
};

const getCurrentUserId = () => {
  if (typeof window === "undefined") return null;
  try {
    const rawUser =
      localStorage.getItem("user") ||
      localStorage.getItem("authUser") ||
      localStorage.getItem("currentUser") ||
      sessionStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const id = parsed?.id ?? parsed?.user_id ?? parsed?.userId ?? null;
      if (id !== null && id !== undefined) return id;
    }
  } catch (e) {}
  return null;
};

const SELF_ACTION_TOOLTIP = "You cannot modify your own account.";

const circleActionSx = (color, soft) => ({
  width: 28,
  height: 28,
  borderRadius: "6px",
  color,
  backgroundColor: soft,
  p: 0.3,
  transition: "all 0.15s ease",
  "&:hover": {
    backgroundColor: color,
    color: "#FFFFFF",
  },
});

const disabledCircleActionSx = {
  width: 28,
  height: 28,
  borderRadius: "6px",
  color: COLORS.textMuted,
  backgroundColor: "#F1F5F9",
  cursor: "not-allowed",
  pointerEvents: "none",
  opacity: 0.6,
  p: 0.3,
};

const SectionHeader = ({ title, icon }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, pb: 0.8, mb: 1, borderBottom: `1px solid ${COLORS.border}` }}>
    {icon}
    <Typography
      sx={{
        fontSize: "0.74rem",
        fontWeight: 800,
        color: COLORS.primaryDark,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {title}
    </Typography>
  </Box>
);

const exportUsersToCsv = (rows) => {
  if (!rows || !rows.length) return;
  const headers = ["Full Name", "Username", "Email", "Phone", "Role", "Manager", "Status", "Created At"];
  const escape = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(",")];
  rows.forEach((r) => {
    lines.push(
      [
        r.full_name,
        r.username,
        r.email,
        r.phone,
        r.role_name || "",
        r.manager_name || "",
        r.status || "",
        r.created_at ? new Date(r.created_at).toISOString() : "",
      ]
        .map(escape)
        .join(",")
    );
  });
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ======================================================
// 3. MAIN COMPONENT
// ======================================================
const Users = () => {
  const { user } = useAuth();
  const can = (permission) => true;
  const features = null;

  // View Mode: "box" (default), "grid", or "table"
  const [viewMode, setViewMode] = useState("box");

  const [usersList, setUsersList] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Clean KPI stats
  const [kpiStats, setKpiStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    managers: 0,
    sales: 0,
    backOffice: 0,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal Dialog Mode: null | "add" | "edit" | "view"
  const [modalMode, setModalMode] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [userForm, setUserForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    role_id: ROLE_SALES,
    manager_id: "",
    profile_image: null,
  });
  const [formErrors, setFormErrors] = useState({});

  const [viewDetails, setViewDetails] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchManagersDropdown();
    fetchUserKpiStats();
  }, []);

  useEffect(() => {
    fetchUsersData();
  }, [page, rowsPerPage, debouncedSearch, roleFilter, statusFilter]);

  const fetchUserKpiStats = async () => {
    try {
      setStatsLoading(true);
      const res = await getUserStats();
      const statsPayload = res?.data?.data || res?.data;
      if (statsPayload && typeof statsPayload.total === "number") {
        setKpiStats(statsPayload);
      }
    } catch (e) {
      console.warn("Using fallback stats calculation", e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchManagersDropdown = async () => {
    try {
      const res = await getUsers({ role: ROLE_MANAGER, limit: 100 });
      const data = res?.data?.data;
      setManagersList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load managers dropdown", e);
    }
  };

  const fetchUsersData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      };

      const res = await getUsers(params);
      const payload = res?.data || {};
      const userArray = Array.isArray(payload.data) ? payload.data : [];
      const totalRecords = payload.pagination?.totalRecords ?? userArray.length;

      setUsersList(userArray);
      setTotalCount(totalRecords);
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to load users list.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, roleFilter, statusFilter]);

  const handleRefresh = async () => {
    await Promise.all([fetchUsersData(), fetchUserKpiStats(), fetchManagersDropdown()]);
    showNotification("User list and metrics refreshed.", "info");
  };

  const buildUserPayload = () => {
    const isSales = Number(userForm.role_id) === ROLE_SALES;
    const payload = {
      role_id: Number(userForm.role_id),
      manager_id: isSales ? userForm.manager_id || null : null,
      full_name: userForm.full_name.trim(),
      username: userForm.username.trim(),
      email: userForm.email.trim(),
      phone: userForm.phone.trim(),
    };
    if (modalMode === "add") {
      payload.password = userForm.password;
    }
    return payload;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;

    try {
      setFormSubmitting(true);
      const payload = buildUserPayload();

      if (modalMode === "add") {
        await createUser(payload);
        showNotification("New team member created successfully!", "success");
      } else {
        await updateUser(selectedUserId, payload);
        showNotification("User account updated successfully!", "success");
      }

      setModalMode(null);
      await Promise.all([fetchUsersData(), fetchUserKpiStats(), fetchManagersDropdown()]);
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to save user details.", "error");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (userObj) => {
    const isActive = userObj.status === STATUS_ACTIVE;
    const newStatus = isActive ? STATUS_INACTIVE : STATUS_ACTIVE;

    try {
      await updateUserStatus(userObj.id, { status: newStatus });
      showNotification(
        `User ${newStatus === STATUS_ACTIVE ? "activated" : "deactivated"} successfully!`,
        "success"
      );
      await Promise.all([fetchUsersData(), fetchUserKpiStats()]);
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to update status.", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await deleteUser(userToDelete.id);
      showNotification("User account soft-deleted successfully.", "success");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await Promise.all([fetchUsersData(), fetchUserKpiStats(), fetchManagersDropdown()]);
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to delete user.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const showNotification = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const getAvatarUrl = (fileName) => {
    if (!fileName) return "";
    return `${API_BASE_URL}/uploads/profiles/${fileName}`;
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : "N/A");

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(0);
  };

  const handleOpenAddModal = () => {
    if (features && features.max_users > 0 && totalCount >= features.max_users) {
      showNotification(
        `Your plan allows maximum ${features.max_users} users. Please upgrade to add more.`,
        "warning"
      );
      return;
    }
    setUserForm({
      full_name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      role_id: ROLE_SALES,
      manager_id: "",
      profile_image: null,
    });
    setFormErrors({});
    setSelectedUserId(null);
    setModalMode("add");
  };

  const handleOpenEditModal = async (userObj) => {
    setSelectedUserId(userObj.id);
    setModalMode("edit");
    setFormErrors({});
    setModalLoading(true);

    try {
      const res = await getUserById(userObj.id);
      const data = res?.data?.data;
      setUserForm({
        full_name: data?.full_name || "",
        username: data?.username || "",
        email: data?.email || "",
        phone: data?.phone || "",
        password: "",
        confirm_password: "",
        role_id: Number(data?.role_id) || ROLE_SALES,
        manager_id: data?.manager_id || "",
        profile_image: data?.profile_image || null,
      });
    } catch (e) {
      showNotification("Failed to load user details.", "error");
      setModalMode(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenViewModal = async (userObj) => {
    setSelectedUserId(userObj.id);
    setModalMode("view");
    setModalLoading(true);

    try {
      const res = await getUserById(userObj.id);
      setViewDetails(res?.data?.data || null);
    } catch (e) {
      showNotification("Failed to load user details.", "error");
      setModalMode(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!userForm.full_name.trim()) errors.full_name = "Full Name is required";
    if (!userForm.username.trim()) errors.username = "Username is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userForm.email.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(userForm.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!userForm.phone.trim()) errors.phone = "Phone number is required";

    if (modalMode === "add") {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:'",.<>\/]).{8,}$/;
      if (!userForm.password) {
        errors.password = "Password is required";
      } else if (!strongPasswordRegex.test(userForm.password)) {
        errors.password = "8+ chars, upper, lower, number & special character";
      }

      if (userForm.password !== userForm.confirm_password) {
        errors.confirm_password = "Passwords do not match";
      }
    }

    if (Number(userForm.role_id) === ROLE_SALES && !userForm.manager_id) {
      errors.manager_id = "Assigning a Manager is mandatory for Sales Users";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Safe computed KPI stats with fallback to usersList
  const computedKpis = useMemo(() => {
    const list = usersList || [];
    const hasKpiData = kpiStats && typeof kpiStats.total === "number" && kpiStats.total > 0;

    if (hasKpiData) {
      return {
        total: Number(kpiStats.total) || 0,
        active: Number(kpiStats.active) || 0,
        inactive: Number(kpiStats.inactive) || 0,
        managers: Number(kpiStats.managers) || 0,
        sales: Number(kpiStats.sales) || 0,
        backOffice: Number(kpiStats.backOffice) || 0,
      };
    }

    // Dynamic fallback from usersList
    return {
      total: totalCount || list.length,
      active: list.filter((u) => String(u.status).toLowerCase() === "active").length,
      inactive: list.filter((u) => String(u.status).toLowerCase() === "inactive").length,
      managers: list.filter(
        (u) =>
          Number(u.role_id) === ROLE_MANAGER ||
          String(u.role_name || "").toLowerCase().includes("manager")
      ).length,
      sales: list.filter(
        (u) =>
          Number(u.role_id) === ROLE_SALES ||
          String(u.role_name || "").toLowerCase().includes("sales")
      ).length,
      backOffice: list.filter(
        (u) =>
          [ROLE_BO_ONLINE, ROLE_BO_FIELD, ROLE_LOAN, ROLE_ACCOUNTS, ROLE_INSTALL, ROLE_PORTAL].includes(
            Number(u.role_id)
          ) ||
          String(u.role_name || "").toLowerCase().includes("office") ||
          String(u.role_name || "").toLowerCase().includes("loan") ||
          String(u.role_name || "").toLowerCase().includes("account")
      ).length,
    };
  }, [kpiStats, totalCount, usersList]);

  // Clean KPI cards array
  const kpiCards = useMemo(
    () => [
      {
        key: "total",
        label: "Total Users",
        value: computedKpis.total,
        caption: "Platform accounts",
        icon: <PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.primary,
        soft: COLORS.primarySoft,
      },
      {
        key: "active",
        label: "Active Users",
        value: computedKpis.active,
        caption: "Active & verified",
        icon: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.success,
        soft: COLORS.successSoft,
      },
      {
        key: "inactive",
        label: "Inactive Users",
        value: computedKpis.inactive,
        caption: "Access suspended",
        icon: <PersonOffOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.danger,
        soft: COLORS.dangerSoft,
      },
      {
        key: "managers",
        label: "Managers",
        value: computedKpis.managers,
        caption: "Team leaders",
        icon: <SupervisorAccountOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.warning,
        soft: COLORS.warningSoft,
      },
      {
        key: "sales",
        label: "Sales Reps",
        value: computedKpis.sales,
        caption: "Field & online sales",
        icon: <TrendingUpRoundedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.indigo,
        soft: COLORS.indigoSoft,
      },
      {
        key: "backOffice",
        label: "Back Office",
        value: computedKpis.backOffice,
        caption: "Operations & ops",
        icon: <SupportAgentOutlinedIcon sx={{ fontSize: 16 }} />,
        color: COLORS.purple,
        soft: COLORS.purpleSoft,
      },
    ],
    [computedKpis]
  );

  const hasActiveFilters = Boolean(search || roleFilter || statusFilter);

  return (
    <Box
      style={{ zoom: 0.90 }}
      sx={{
        width: "100%",
        backgroundColor: COLORS.bg,
        minHeight: "100vh",
        p: { xs: 1.5, sm: 2 },
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>

        {/* ================= 1. BREADCRUMBS ================= */}
        <Breadcrumbs
          separator={<NavigateNextRoundedIcon sx={{ fontSize: "0.85rem", color: COLORS.textSecondary }} />}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" gap={0.5}>
            <HomeOutlinedIcon sx={{ fontSize: "0.95rem", color: COLORS.textSecondary }} />
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: COLORS.textSecondary }}>
              Dashboard
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, color: COLORS.textSecondary }}>
            Administration
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.primary }}>
            User Management
          </Typography>
        </Breadcrumbs>

        {/* ================= 2. TOP HEADER & ACTION TOOLBAR ================= */}
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
                  color: COLORS.primaryDark,
                  letterSpacing: -0.3,
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                }}
              >
                User Management Directory
              </Typography>
              <Chip
                label={`${totalCount || usersList.length} Members`}
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
              Manage managers and sales team members, assign reporting lines, and control account access.
            </Typography>
          </Box>

          {/* Action Controls Toolbar: [ Table ] [ Grid ] Sequence */}
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
            {/* View Mode Toggle: Table first, Grid second */}
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
                { mode: "box", label: "Box", icon: <ViewAgendaOutlinedIcon sx={{ fontSize: "1.05rem" }} /> },
                { mode: "grid", label: "Grid", icon: <GridViewOutlinedIcon sx={{ fontSize: "1.05rem" }} /> },
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
                      backgroundColor: isActive ? "#FFFFFF" : "transparent",
                      color: isActive ? COLORS.primaryDark : COLORS.textSecondary,
                      boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                      "&:hover": {
                        backgroundColor: isActive ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                      },
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>

            <Tooltip title="Refresh Directory">
              <IconButton onClick={handleRefresh} disabled={loading} size="small" sx={iconSquareBtnSx}>
                <RefreshRoundedIcon
                  sx={{
                    fontSize: 18,
                    animation: loading ? "spin 0.9s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={() => exportUsersToCsv(usersList)}
              disabled={!usersList.length}
              sx={outlinedButtonSx}
            >
              Export
            </Button>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon sx={{ fontSize: 16 }} />}
              onClick={handleOpenAddModal}
              sx={primaryButtonSx}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {/* ================= 3. CLEAN KPI CARDS (Desktop 1-Line) ================= */}
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
          {kpiCards.map((s) => (
            <Card
              key={s.key}
              elevation={0}
              sx={{
                borderRadius: "12px",
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.card,
                boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: "0 4px 14px rgba(11, 58, 99, 0.08)",
                  transform: "translateY(-2px)",
                  borderColor: s.color,
                },
              }}
            >
              <CardContent sx={{ p: 1.2, "&:last-child": { pb: 1.2 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.6 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: COLORS.textSecondary,
                      fontWeight: 700,
                      fontSize: "0.64rem",
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.label}
                  </Typography>
                  <Avatar
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "6px",
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
                  {statsLoading && loading ? <Skeleton width={35} height={24} /> : s.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: COLORS.textSecondary,
                    mt: 0.2,
                    display: "block",
                    fontWeight: 500,
                    fontSize: "0.66rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.caption}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* ================= 4. FILTER TOOLBAR ================= */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1.8, mb: 2.5, width: "100%", boxSizing: "border-box" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 1.5 }}>
            <Box sx={{ flex: "1 1 240px", minWidth: 200 }}>
              <FieldLabel>Search Users</FieldLabel>
              <TextField
                fullWidth
                placeholder="Search name, username, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={controlSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: COLORS.textMuted, fontSize: "1rem" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ flex: "0 1 180px", minWidth: 140 }}>
              <FieldLabel>Filter by Role</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(0);
                }}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={controlSx}
                renderValue={(val) =>
                  val === "" ? (
                    <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>
                      All Roles
                    </Box>
                  ) : (
                    getRoleLabel(val)
                  )
                }
              >
                <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Roles</MenuItem>
                <MenuItem value={ROLE_SUPER_ADMIN} sx={{ fontSize: "0.78rem" }}>Super Admin</MenuItem>
                <MenuItem value={ROLE_MANAGER} sx={{ fontSize: "0.78rem" }}>Manager</MenuItem>
                <MenuItem value={ROLE_SALES} sx={{ fontSize: "0.78rem" }}>Sales Representative</MenuItem>
                <MenuItem value={ROLE_BO_ONLINE} sx={{ fontSize: "0.78rem" }}>Back Office Online</MenuItem>
                <MenuItem value={ROLE_BO_FIELD} sx={{ fontSize: "0.78rem" }}>Back Office Field</MenuItem>
                <MenuItem value={ROLE_LOAN} sx={{ fontSize: "0.78rem" }}>Loan Officer</MenuItem>
                <MenuItem value={ROLE_ACCOUNTS} sx={{ fontSize: "0.78rem" }}>Accounts Officer</MenuItem>
                <MenuItem value={ROLE_INSTALL} sx={{ fontSize: "0.78rem" }}>Installation Lead</MenuItem>
                <MenuItem value={ROLE_PORTAL} sx={{ fontSize: "0.78rem" }}>Portal Entry</MenuItem>
              </Select>
            </Box>

            <Box sx={{ flex: "0 1 150px", minWidth: 120 }}>
              <FieldLabel>Account Status</FieldLabel>
              <Select
                fullWidth
                displayEmpty
                size="small"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                IconComponent={KeyboardArrowDownRoundedIcon}
                sx={controlSx}
                renderValue={(val) =>
                  val === "" ? (
                    <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>
                      All Status
                    </Box>
                  ) : (
                    val
                  )
                }
              >
                <MenuItem value="" sx={{ fontSize: "0.78rem" }}>All Status</MenuItem>
                <MenuItem value={STATUS_ACTIVE} sx={{ fontSize: "0.78rem" }}>Active</MenuItem>
                <MenuItem value={STATUS_INACTIVE} sx={{ fontSize: "0.78rem" }}>Inactive</MenuItem>
              </Select>
            </Box>

            <Box sx={{ flex: "0 0 auto" }}>
              <Tooltip title="Reset Filters">
                <span>
                  <IconButton
                    onClick={handleResetFilters}
                    disabled={!hasActiveFilters}
                    size="small"
                    sx={{
                      ...iconSquareBtnSx,
                      color: hasActiveFilters ? COLORS.primary : COLORS.textMuted,
                      "&:hover": hasActiveFilters
                        ? { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary }
                        : {},
                    }}
                  >
                    <FilterListOffIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* ================= 5. MAIN CONTENT (Table vs Grid View) ================= */}
        {viewMode === "table" ? (
          /* ================= TABLE VIEW (With Smooth Horizontal Scrollbar) ================= */
          <Paper elevation={0} sx={{ ...cardSx, p: 0, overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
            <TableContainer
              sx={{
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
              <Table
                sx={{
                  minWidth: 1080,
                  width: "100%",
                }}
                size="small"
              >
                <TableHead>
                  <TableRow>
                    {[
                      { label: "USER", minWidth: 220 },
                      { label: "ROLE", minWidth: 150 },
                      { label: "MANAGER", minWidth: 150 },
                      { label: "CONTACT", minWidth: 220 },
                      { label: "STATUS", minWidth: 130 },
                      { label: "CREATED", minWidth: 110 },
                      { label: "ACTIONS", minWidth: 130, align: "right" },
                    ].map((h, i) => (
                      <TableCell
                        key={i}
                        align={h.align || "left"}
                        sx={{
                          fontWeight: 800,
                          color: COLORS.primaryDark,
                          fontSize: "0.68rem",
                          letterSpacing: "0.03em",
                          py: 1.1,
                          px: 1.4,
                          minWidth: h.minWidth,
                          width: h.minWidth,
                          backgroundColor: "#F8FAFC",
                          borderBottom: `2px solid ${COLORS.border}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    Array.from(new Array(rowsPerPage > 8 ? 8 : rowsPerPage)).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ py: 1, px: 1.4 }}>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Skeleton variant="circular" width={28} height={28} />
                            <Box sx={{ flex: 1 }}>
                              <Skeleton width="60%" height={12} />
                              <Skeleton width="40%" height={10} />
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ py: 1, px: 1.4 }}><Skeleton variant="rounded" width={70} height={20} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.4 }}><Skeleton width={80} height={12} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.4 }}><Skeleton width={110} height={12} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.4 }}><Skeleton width={60} height={20} /></TableCell>
                        <TableCell sx={{ py: 1, px: 1.4 }}><Skeleton width={70} height={12} /></TableCell>
                        <TableCell align="right" sx={{ py: 1, px: 1.4 }}><Skeleton width={90} height={26} sx={{ ml: "auto" }} /></TableCell>
                      </TableRow>
                    ))
                  ) : usersList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6, border: 0 }}>
                        <Box sx={{ textAlign: "center", maxWidth: 320, mx: "auto" }}>
                          <Box
                            sx={{
                              width: 52,
                              height: 52,
                              borderRadius: "12px",
                              backgroundColor: COLORS.primarySoft,
                              color: COLORS.primary,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mx: "auto",
                              mb: 1.5,
                            }}
                          >
                            <Inventory2OutlinedIcon sx={{ fontSize: "1.6rem" }} />
                          </Box>
                          <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.92rem" }}>
                            No Users Found
                          </Typography>
                          <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.78rem", mt: 0.4, mb: 1.5 }}>
                            Try adjusting your search queries or filter selections, or create a new user.
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PersonAddAlt1OutlinedIcon sx={{ fontSize: 15 }} />}
                            onClick={handleOpenAddModal}
                            sx={primaryButtonSx}
                          >
                            Add New User
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    usersList.map((row) => {
                      const isActive = row.status === STATUS_ACTIVE;
                      const roleChip = getRoleChipByName(row.role_name);
                      const isSelfRow =
                        currentUserId !== null &&
                        currentUserId !== undefined &&
                        String(row.id) === String(currentUserId);

                      return (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 1.1, px: 1.4 },
                            "&:hover td": { backgroundColor: "#FAFBFD" },
                          }}
                        >
                          {/* User Column */}
                          <TableCell sx={{ minWidth: 220 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                              <Avatar
                                src={getAvatarUrl(row.profile_image)}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  backgroundColor: COLORS.primaryDark,
                                  color: "#FFFFFF",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                }}
                              >
                                {getInitials(row.full_name)}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography
                                  sx={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: "0.76rem", lineHeight: 1.15 }}
                                  noWrap
                                >
                                  {row.full_name}
                                </Typography>
                                <Typography sx={{ color: COLORS.textMuted, fontSize: "0.68rem" }} noWrap>
                                  @{row.username}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Role */}
                          <TableCell sx={{ minWidth: 150 }}>
                            <Chip
                              label={roleChip.label}
                              size="small"
                              sx={{
                                backgroundColor: roleChip.bg,
                                color: roleChip.color,
                                fontWeight: 700,
                                fontSize: "0.68rem",
                                height: 20,
                                px: 0.4,
                              }}
                            />
                          </TableCell>

                          {/* Manager */}
                          <TableCell sx={{ minWidth: 150, fontSize: "0.74rem", color: COLORS.textPrimary, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {row.manager_name || "—"}
                          </TableCell>

                          {/* Contact */}
                          <TableCell sx={{ minWidth: 220 }}>
                            <Stack direction="row" alignItems="center" gap={0.5} sx={{ mb: 0.2 }}>
                              <MailOutlineRoundedIcon sx={{ fontSize: "0.72rem", color: COLORS.textMuted }} />
                              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }} noWrap>
                                {row.email}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                              <CallOutlinedIcon sx={{ fontSize: "0.72rem", color: COLORS.textMuted }} />
                              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary }}>
                                {row.phone || "N/A"}
                              </Typography>
                            </Stack>
                          </TableCell>

                          {/* Status + Switch */}
                          <TableCell sx={{ minWidth: 130, whiteSpace: "nowrap" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                              <Chip
                                label={row.status}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: "0.66rem",
                                  height: 19,
                                  backgroundColor: isActive ? COLORS.successSoft : COLORS.dangerSoft,
                                  color: isActive ? COLORS.success : COLORS.danger,
                                }}
                              />
                              <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : (isActive ? "Deactivate User" : "Activate User")}>
                                <span>
                                  <Switch
                                    size="small"
                                    checked={isActive}
                                    disabled={isSelfRow}
                                    onChange={() => handleToggleStatus(row)}
                                    sx={{
                                      transform: "scale(0.85)",
                                      "& .MuiSwitch-switchBase.Mui-checked": { color: COLORS.success },
                                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                        backgroundColor: COLORS.success,
                                      },
                                    }}
                                  />
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>

                          {/* Created Date */}
                          <TableCell sx={{ minWidth: 110, fontSize: "0.72rem", color: COLORS.textSecondary, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {formatDate(row.created_at)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell align="right" sx={{ minWidth: 130, width: 130, whiteSpace: "nowrap" }}>
                            <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={0.5}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenViewModal(row)}
                                  sx={circleActionSx(COLORS.primary, COLORS.primarySoft)}
                                >
                                  <VisibilityOutlinedIcon sx={{ fontSize: "0.9rem" }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Edit User"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEditModal(row)}
                                    disabled={isSelfRow}
                                    sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.warning, COLORS.warningSoft)}
                                  >
                                    <EditOutlinedIcon sx={{ fontSize: "0.9rem" }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Delete User"}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setUserToDelete(row);
                                      setDeleteDialogOpen(true);
                                    }}
                                    disabled={isSelfRow}
                                    sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.danger, COLORS.dangerSoft)}
                                  >
                                    <DeleteOutlineOutlinedIcon sx={{ fontSize: "0.9rem" }} />
                                  </IconButton>
                                </span>
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

            {/* Compact Pagination */}
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[6, 10, 12, 24, 48]}
              sx={{
                borderTop: `1px solid ${COLORS.border}`,
                "& .MuiTablePagination-toolbar": {
                  minHeight: 36,
                  px: 1.5,
                },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontSize: "0.72rem",
                  color: COLORS.textSecondary,
                },
                "& .MuiTablePagination-select": {
                  fontSize: "0.72rem",
                },
              }}
            />
          </Paper>
        ) : viewMode === "box" ? (
          /* ================= NEW BOX VIEW (Full-Width Horizontal Cards Stacked Vertically) ================= */
          <Box sx={{ width: "100%" }}>
            {loading ? (
              <Stack spacing={2}>
                {Array.from(new Array(4)).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: "14px" }} />
                ))}
              </Stack>
            ) : usersList.length === 0 ? (
              <Paper elevation={0} sx={{ ...cardSx, p: 6, textAlign: "center", width: "100%", boxSizing: "border-box" }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "12px",
                    backgroundColor: COLORS.primarySoft,
                    color: COLORS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <Inventory2OutlinedIcon sx={{ fontSize: "1.6rem" }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.92rem" }}>
                  No Users Found
                </Typography>
                <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.78rem", mt: 0.4, mb: 1.5 }}>
                  Try adjusting your search queries or filter selections, or create a new user.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddAlt1OutlinedIcon sx={{ fontSize: 15 }} />}
                  onClick={handleOpenAddModal}
                  sx={primaryButtonSx}
                >
                  Add New User
                </Button>
              </Paper>
            ) : (
              <Stack spacing={1.8}>
                {usersList.map((row) => {
                  const isActive = row.status === STATUS_ACTIVE;
                  const roleChip = getRoleChipByName(row.role_name);
                  const isSelfRow =
                    currentUserId !== null &&
                    currentUserId !== undefined &&
                    String(row.id) === String(currentUserId);

                  return (
                    <Card
                      key={row.id}
                      elevation={0}
                      sx={{
                        borderRadius: "14px",
                        border: `1px solid ${COLORS.border}`,
                        borderLeft: `5px solid ${isActive ? COLORS.primary : COLORS.danger}`,
                        backgroundColor: COLORS.card,
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          boxShadow: "0 6px 20px rgba(11, 58, 99, 0.08)",
                          borderColor: isActive ? COLORS.primary : "#EF4444",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
                        {/* Top Bar of Box: Avatar, Name, Role, Status & Actions */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 1.5,
                            borderBottom: `1px solid ${COLORS.border}`,
                            pb: 1.4,
                            mb: 1.4,
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                            <Avatar
                              src={getAvatarUrl(row.profile_image)}
                              sx={{
                                width: 42,
                                height: 42,
                                backgroundColor: COLORS.primaryDark,
                                color: "#FFFFFF",
                                fontSize: "0.9rem",
                                fontWeight: 800,
                              }}
                            >
                              {getInitials(row.full_name)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap" }}>
                                <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.95rem" }}>
                                  {row.full_name}
                                </Typography>
                                <Chip
                                  label={roleChip.label}
                                  size="small"
                                  sx={{
                                    backgroundColor: roleChip.bg,
                                    color: roleChip.color,
                                    fontWeight: 700,
                                    fontSize: "0.68rem",
                                    height: 20,
                                    px: 0.5,
                                  }}
                                />
                                <Chip
                                  label={`ID: #${row.id}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: "#F1F5F9",
                                    color: COLORS.textSecondary,
                                    fontWeight: 700,
                                    fontSize: "0.65rem",
                                    height: 18,
                                  }}
                                />
                              </Stack>
                              <Typography sx={{ color: COLORS.textMuted, fontSize: "0.74rem", mt: 0.2 }}>
                                @{row.username}
                              </Typography>
                            </Box>
                          </Stack>

                          {/* Right Controls: Status & Action Buttons */}
                          <Stack direction="row" spacing={1.2} alignItems="center">
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.6,
                                bgcolor: isActive ? COLORS.successSoft : COLORS.dangerSoft,
                                px: 1,
                                py: 0.3,
                                borderRadius: "20px",
                              }}
                            >
                              <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: isActive ? COLORS.success : COLORS.danger }}>
                                {row.status}
                              </Typography>
                              <Switch
                                size="small"
                                checked={isActive}
                                disabled={isSelfRow}
                                onChange={() => handleToggleStatus(row)}
                                sx={{
                                  transform: "scale(0.8)",
                                  "& .MuiSwitch-switchBase.Mui-checked": { color: COLORS.success },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: COLORS.success },
                                }}
                              />
                            </Box>

                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                              onClick={() => handleOpenViewModal(row)}
                              sx={{
                                fontSize: "0.75rem",
                                textTransform: "none",
                                fontWeight: 700,
                                borderColor: COLORS.border,
                                color: COLORS.primary,
                                borderRadius: "8px",
                                height: 30,
                                px: 1.2,
                                "&:hover": { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
                              }}
                            >
                              View Profile
                            </Button>

                            <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Edit User"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditModal(row)}
                                  disabled={isSelfRow}
                                  sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.warning, COLORS.warningSoft)}
                                >
                                  <EditOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </span>
                            </Tooltip>

                            <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Delete User"}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setUserToDelete(row);
                                    setDeleteDialogOpen(true);
                                  }}
                                  disabled={isSelfRow}
                                  sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.danger, COLORS.dangerSoft)}
                                >
                                  <DeleteOutlineOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </Box>

                        {/* Bottom Info Grid: 3 Clean Panels */}
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                            gap: 1.5,
                            backgroundColor: "#F8FAFC",
                            p: 1.5,
                            borderRadius: "10px",
                            border: `1px solid ${COLORS.border}`,
                          }}
                        >
                          <Box>
                            <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.03em", display: "block", mb: 0.5 }}>
                              Contact Information
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.4 }}>
                              <MailOutlineRoundedIcon sx={{ fontSize: "0.85rem", color: COLORS.textMuted }} />
                              <Typography
                                component="a"
                                href={`mailto:${row.email}`}
                                sx={{ fontSize: "0.76rem", color: COLORS.primary, fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                                noWrap
                              >
                                {row.email}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={0.8}>
                              <CallOutlinedIcon sx={{ fontSize: "0.85rem", color: COLORS.textMuted }} />
                              <Typography
                                component="a"
                                href={`tel:${row.phone}`}
                                sx={{ fontSize: "0.76rem", color: COLORS.textPrimary, fontWeight: 500, textDecoration: "none" }}
                              >
                                {row.phone || "—"}
                              </Typography>
                            </Stack>
                          </Box>

                          <Box>
                            <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.03em", display: "block", mb: 0.5 }}>
                              Reporting & Governance
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.4 }}>
                              <SupervisorAccountOutlinedIcon sx={{ fontSize: "0.85rem", color: COLORS.textMuted }} />
                              <Typography sx={{ fontSize: "0.76rem", color: COLORS.textPrimary, fontWeight: 600 }}>
                                {row.manager_name ? row.manager_name : "Direct Super Admin"}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontSize: "0.7rem", ml: 2.2, display: "block" }}>
                              {row.role_name} Division
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" sx={{ color: COLORS.textMuted, fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.03em", display: "block", mb: 0.5 }}>
                              Platform Credentials
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.4 }}>
                              <EventOutlinedIcon sx={{ fontSize: "0.85rem", color: COLORS.textMuted }} />
                              <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                                Joined {formatDate(row.created_at)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={0.8}>
                              <CheckCircleOutlineOutlinedIcon sx={{ fontSize: "0.85rem", color: isActive ? COLORS.success : COLORS.danger }} />
                              <Typography sx={{ fontSize: "0.72rem", color: isActive ? COLORS.success : COLORS.danger, fontWeight: 600 }}>
                                {isActive ? "Verified Active Access" : "Account Suspended"}
                              </Typography>
                            </Stack>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}

            {/* Pagination for Box view */}
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[6, 10, 12, 24, 48]}
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "10px",
                  backgroundColor: COLORS.card,
                  "& .MuiTablePagination-toolbar": { minHeight: 36, px: 1.5 },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.72rem", color: COLORS.textSecondary },
                  "& .MuiTablePagination-select": { fontSize: "0.72rem" },
                }}
              />
            </Box>
          </Box>
        ) : (
          /* ================= GRID VIEW (3-Column Matrix Cards) ================= */
          <Box sx={{ width: "100%" }}>
            {loading ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 2 }}>
                {Array.from(new Array(6)).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={190} sx={{ borderRadius: "12px" }} />
                ))}
              </Box>
            ) : usersList.length === 0 ? (
              <Paper elevation={0} sx={{ ...cardSx, p: 6, textAlign: "center", width: "100%", boxSizing: "border-box" }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "12px",
                    backgroundColor: COLORS.primarySoft,
                    color: COLORS.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <Inventory2OutlinedIcon sx={{ fontSize: "1.6rem" }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.92rem" }}>
                  No Users Found
                </Typography>
                <Typography sx={{ color: COLORS.textSecondary, fontSize: "0.78rem", mt: 0.4, mb: 1.5 }}>
                  Try adjusting your search queries or filter selections, or create a new user.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddAlt1OutlinedIcon sx={{ fontSize: 15 }} />}
                  onClick={handleOpenAddModal}
                  sx={primaryButtonSx}
                >
                  Add New User
                </Button>
              </Paper>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                  gap: 2,
                }}
              >
                {usersList.map((row) => {
                  const isActive = row.status === STATUS_ACTIVE;
                  const roleChip = getRoleChipByName(row.role_name);
                  const isSelfRow =
                    currentUserId !== null &&
                    currentUserId !== undefined &&
                    String(row.id) === String(currentUserId);

                  return (
                    <Card
                      key={row.id}
                      elevation={0}
                      sx={{
                        borderRadius: "12px",
                        border: `1px solid ${COLORS.border}`,
                        backgroundColor: COLORS.card,
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        "&:hover": {
                          boxShadow: "0 4px 14px rgba(11, 58, 99, 0.08)",
                          borderColor: COLORS.primary,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {/* Card Header: Avatar, Name, Role, Status */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Avatar
                              src={getAvatarUrl(row.profile_image)}
                              sx={{
                                width: 40,
                                height: 40,
                                backgroundColor: COLORS.primaryDark,
                                color: "#FFFFFF",
                                fontSize: "0.85rem",
                                fontWeight: 800,
                              }}
                            >
                              {getInitials(row.full_name)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "0.88rem", lineHeight: 1.2 }} noWrap>
                                {row.full_name}
                              </Typography>
                              <Typography sx={{ color: COLORS.textMuted, fontSize: "0.72rem" }} noWrap>
                                @{row.username}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Status Switch */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                            <Chip
                              label={row.status}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.65rem",
                                height: 18,
                                backgroundColor: isActive ? COLORS.successSoft : COLORS.dangerSoft,
                                color: isActive ? COLORS.success : COLORS.danger,
                              }}
                            />
                            <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : (isActive ? "Deactivate User" : "Activate User")}>
                              <span>
                                <Switch
                                  size="small"
                                  checked={isActive}
                                  disabled={isSelfRow}
                                  onChange={() => handleToggleStatus(row)}
                                  sx={{
                                    transform: "scale(0.8)",
                                    "& .MuiSwitch-switchBase.Mui-checked": { color: COLORS.success },
                                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                      backgroundColor: COLORS.success,
                                    },
                                  }}
                                />
                              </span>
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Role Chip */}
                        <Box>
                          <Chip
                            label={roleChip.label}
                            size="small"
                            sx={{
                              backgroundColor: roleChip.bg,
                              color: roleChip.color,
                              fontWeight: 700,
                              fontSize: "0.68rem",
                              height: 22,
                              px: 0.5,
                            }}
                          />
                        </Box>

                        <Divider sx={{ borderColor: COLORS.border }} />

                        {/* Card Details: Clean Full-Width Rows */}
                        <Box
                          sx={{
                            backgroundColor: "#F8FAFC",
                            p: 1.2,
                            borderRadius: "8px",
                            border: `1px solid ${COLORS.border}`,
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.7,
                          }}
                        >
                          {/* Row 1: Email */}
                          <Stack direction="row" alignItems="center" gap={0.8} sx={{ minWidth: 0 }}>
                            <MailOutlineRoundedIcon sx={{ fontSize: "0.82rem", color: COLORS.textMuted, flexShrink: 0 }} />
                            <Typography
                              sx={{
                                fontSize: "0.74rem",
                                color: COLORS.textPrimary,
                                fontWeight: 500,
                                wordBreak: "break-all",
                              }}
                            >
                              {row.email}
                            </Typography>
                          </Stack>

                          {/* Row 2: Phone & Reporting Manager */}
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                            <Stack direction="row" alignItems="center" gap={0.8} sx={{ minWidth: 0 }}>
                              <CallOutlinedIcon sx={{ fontSize: "0.82rem", color: COLORS.textMuted, flexShrink: 0 }} />
                              <Typography sx={{ fontSize: "0.74rem", color: COLORS.textPrimary, fontWeight: 500 }}>
                                {row.phone || "N/A"}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" gap={0.5} sx={{ minWidth: 0 }}>
                              <SupervisorAccountOutlinedIcon sx={{ fontSize: "0.82rem", color: COLORS.textMuted, flexShrink: 0 }} />
                              <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, fontWeight: 500 }} noWrap>
                                {row.manager_name ? row.manager_name : "Direct Admin"}
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Row 3: Joined Date */}
                          <Stack direction="row" alignItems="center" gap={0.8}>
                            <EventOutlinedIcon sx={{ fontSize: "0.82rem", color: COLORS.textMuted, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }}>
                              Joined {formatDate(row.created_at)}
                            </Typography>
                          </Stack>
                        </Box>
                      </CardContent>

                      {/* Card Footer: Action Buttons */}
                      <Box
                        sx={{
                          px: 2,
                          py: 1.2,
                          borderTop: `1px solid ${COLORS.border}`,
                          backgroundColor: "#FAFBFD",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Button
                          size="small"
                          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleOpenViewModal(row)}
                          sx={{
                            fontSize: "0.74rem",
                            textTransform: "none",
                            fontWeight: 700,
                            color: COLORS.primary,
                            p: 0,
                            "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                          }}
                        >
                          View Profile
                        </Button>

                        <Stack direction="row" alignItems="center" gap={0.6}>
                          <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Edit User"}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditModal(row)}
                                disabled={isSelfRow}
                                sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.warning, COLORS.warningSoft)}
                              >
                                <EditOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title={isSelfRow ? SELF_ACTION_TOOLTIP : "Delete User"}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setUserToDelete(row);
                                  setDeleteDialogOpen(true);
                                }}
                                disabled={isSelfRow}
                                sx={isSelfRow ? disabledCircleActionSx : circleActionSx(COLORS.danger, COLORS.dangerSoft)}
                              >
                                <DeleteOutlineOutlinedIcon sx={{ fontSize: "0.85rem" }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )}

            {/* Pagination for Grid view */}
            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[6, 10, 12, 24, 48]}
                sx={{
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "10px",
                  backgroundColor: COLORS.card,
                  "& .MuiTablePagination-toolbar": {
                    minHeight: 36,
                    px: 1.5,
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: "0.72rem",
                    color: COLORS.textSecondary,
                  },
                  "& .MuiTablePagination-select": {
                    fontSize: "0.72rem",
                  },
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* ================= 6. ADD / EDIT USER DIALOG POPUP ================= */}
      <Dialog
        open={modalMode === "add" || modalMode === "edit"}
        onClose={() => !formSubmitting && setModalMode(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            p: 0,
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(11, 58, 99, 0.16)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            borderBottom: `1px solid ${COLORS.border}`,
            backgroundColor: "#FAFBFD",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                backgroundColor: modalMode === "add" ? COLORS.primarySoft : COLORS.warningSoft,
                color: modalMode === "add" ? COLORS.primary : COLORS.warning,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {modalMode === "add" ? (
                <PersonAddAlt1OutlinedIcon sx={{ fontSize: 22 }} />
              ) : (
                <EditOutlinedIcon sx={{ fontSize: 22 }} />
              )}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: COLORS.textPrimary, lineHeight: 1.2 }}>
                {modalMode === "add" ? "Add New User" : "Edit User Profile"}
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                {modalMode === "add"
                  ? "Create login credentials and assign team roles"
                  : "Update employee details, reporting manager and permissions"}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setModalMode(null)} disabled={formSubmitting} sx={iconSquareBtnSx}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {modalLoading ? (
            <Box sx={{ py: 3, display: "flex", flexDirection: "column", gap: 2 }}>
              {Array.from(new Array(5)).map((_, idx) => (
                <Box key={idx}>
                  <Skeleton width={100} height={12} sx={{ mb: 0.8 }} />
                  <Skeleton variant="rounded" height={40} sx={{ borderRadius: "8px" }} />
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
              {/* SECTION 1: BASIC INFORMATION */}
              <Box>
                <SectionHeader title="Basic Information" icon={<PersonOutlineRoundedIcon sx={{ fontSize: 16, color: COLORS.primary }} />} />
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <Box>
                    <FieldLabel required>Full Name</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. Ramesh Kumar"
                      value={userForm.full_name}
                      onChange={(e) => handleFormChange("full_name", e.target.value)}
                      error={Boolean(formErrors.full_name)}
                      helperText={formErrors.full_name || ""}
                      sx={dialogControlSx}
                    />
                  </Box>
                  <Box>
                    <FieldLabel required>Username</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. ramesh_solar"
                      value={userForm.username}
                      onChange={(e) => handleFormChange("username", e.target.value)}
                      error={Boolean(formErrors.username)}
                      helperText={formErrors.username || ""}
                      sx={dialogControlSx}
                    />
                  </Box>
                  <Box>
                    <FieldLabel required>Email Address</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      type="email"
                      placeholder="e.g. ramesh@smartsunpower.tech"
                      value={userForm.email}
                      onChange={(e) => handleFormChange("email", e.target.value)}
                      error={Boolean(formErrors.email)}
                      helperText={formErrors.email || ""}
                      sx={dialogControlSx}
                    />
                  </Box>
                  <Box>
                    <FieldLabel required>Phone Number</FieldLabel>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. 9876543210"
                      value={userForm.phone}
                      onChange={(e) => handleFormChange("phone", e.target.value)}
                      error={Boolean(formErrors.phone)}
                      helperText={formErrors.phone || ""}
                      sx={dialogControlSx}
                    />
                  </Box>
                </Box>
              </Box>

              {/* SECTION 2: ROLE & REPORTING */}
              <Box>
                <SectionHeader title="Role &amp; Reporting" icon={<ShieldOutlinedIcon sx={{ fontSize: 16, color: COLORS.primary }} />} />
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <Box>
                    <FieldLabel required>Designated Role</FieldLabel>
                    <Select
                      fullWidth
                      size="small"
                      value={userForm.role_id}
                      onChange={(e) => handleFormChange("role_id", e.target.value)}
                      IconComponent={KeyboardArrowDownRoundedIcon}
                      sx={dialogControlSx}
                    >
                      <MenuItem value={ROLE_SUPER_ADMIN} sx={{ fontSize: "0.8rem" }}>Super Admin</MenuItem>
                      {can("has_manager_role") && (
                        <MenuItem value={ROLE_MANAGER} sx={{ fontSize: "0.8rem" }}>Manager</MenuItem>
                      )}
                      <MenuItem value={ROLE_SALES} sx={{ fontSize: "0.8rem" }}>Sales Representative</MenuItem>
                      <MenuItem value={ROLE_BO_ONLINE} sx={{ fontSize: "0.8rem" }}>Back Office Online</MenuItem>
                      <MenuItem value={ROLE_BO_FIELD} sx={{ fontSize: "0.8rem" }}>Back Office Field</MenuItem>
                      <MenuItem value={ROLE_LOAN} sx={{ fontSize: "0.8rem" }}>Loan Officer</MenuItem>
                      <MenuItem value={ROLE_ACCOUNTS} sx={{ fontSize: "0.8rem" }}>Accounts Officer</MenuItem>
                      <MenuItem value={ROLE_INSTALL} sx={{ fontSize: "0.8rem" }}>Installation Lead</MenuItem>
                      <MenuItem value={ROLE_PORTAL} sx={{ fontSize: "0.8rem" }}>Portal Entry</MenuItem>
                    </Select>
                  </Box>

                  {Number(userForm.role_id) === ROLE_SALES ? (
                    <Box>
                      <FieldLabel required>Assign Manager</FieldLabel>
                      <Select
                        fullWidth
                        displayEmpty
                        size="small"
                        value={userForm.manager_id}
                        onChange={(e) => handleFormChange("manager_id", e.target.value)}
                        IconComponent={KeyboardArrowDownRoundedIcon}
                        error={Boolean(formErrors.manager_id)}
                        sx={dialogControlSx}
                        renderValue={(val) =>
                          val === "" ? (
                            <Box component="span" sx={{ color: COLORS.textMuted, fontSize: "0.8rem" }}>
                              Select reporting manager...
                            </Box>
                          ) : (
                            managersList.find((m) => String(m.id) === String(val))?.full_name || ""
                          )
                        }
                      >
                        {managersList.map((mgr) => (
                          <MenuItem key={mgr.id} value={mgr.id} sx={{ fontSize: "0.8rem" }}>
                            {mgr.full_name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.manager_id && (
                        <Typography sx={{ color: COLORS.danger, fontSize: "0.7rem", mt: 0.4 }}>
                          {formErrors.manager_id}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography sx={{ fontSize: "0.74rem", color: COLORS.textMuted, fontStyle: "italic", pt: 2 }}>
                        Direct organizational reporting (No manager needed)
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* SECTION 3: ACCOUNT SECURITY (Only for Add) */}
              {modalMode === "add" && (
                <Box>
                  <SectionHeader title="Account Security" icon={<LockOutlinedIcon sx={{ fontSize: 16, color: COLORS.primary }} />} />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                    <Box>
                      <FieldLabel required>Login Password</FieldLabel>
                      <TextField
                        fullWidth
                        size="small"
                        type="password"
                        placeholder="8+ chars, upper, lower, symbol"
                        value={userForm.password}
                        onChange={(e) => handleFormChange("password", e.target.value)}
                        error={Boolean(formErrors.password)}
                        helperText={formErrors.password || ""}
                        sx={dialogControlSx}
                      />
                    </Box>
                    <Box>
                      <FieldLabel required>Confirm Password</FieldLabel>
                      <TextField
                        fullWidth
                        size="small"
                        type="password"
                        placeholder="Re-enter password"
                        value={userForm.confirm_password}
                        onChange={(e) => handleFormChange("confirm_password", e.target.value)}
                        error={Boolean(formErrors.confirm_password)}
                        helperText={formErrors.confirm_password || ""}
                        sx={dialogControlSx}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${COLORS.border}`,
            backgroundColor: "#FAFBFD",
            gap: 1.2,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setModalMode(null)}
            disabled={formSubmitting}
            sx={outlinedButtonSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveUser}
            disabled={formSubmitting || modalLoading}
            startIcon={formSubmitting ? <CircularProgress size={15} color="inherit" /> : null}
            sx={primaryButtonSx}
          >
            {modalMode === "add" ? "Create Team Member" : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= 7. VIEW USER DETAILS DIALOG POPUP ================= */}
      <Dialog
        open={modalMode === "view"}
        onClose={() => setModalMode(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "14px",
            p: 0,
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(11, 58, 99, 0.16)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.8,
            borderBottom: `1px solid ${COLORS.border}`,
            backgroundColor: "#FAFBFD",
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: COLORS.textPrimary }}>
            User Profile
          </Typography>
          <IconButton size="small" onClick={() => setModalMode(null)} sx={iconSquareBtnSx}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          {modalLoading ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Skeleton variant="circular" width={64} height={64} sx={{ mx: "auto", mb: 1.5 }} />
              <Skeleton width={140} height={20} sx={{ mx: "auto", mb: 0.5 }} />
              <Skeleton width={90} height={14} sx={{ mx: "auto", mb: 2 }} />
              <Stack gap={1}>
                {Array.from(new Array(5)).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={44} sx={{ borderRadius: "8px" }} />
                ))}
              </Stack>
            </Box>
          ) : viewDetails ? (
            <Box>
              {/* Profile Card Header */}
              <Box sx={{ textAlign: "center", mb: 2.5 }}>
                <Avatar
                  src={getAvatarUrl(viewDetails.profile_image)}
                  sx={{
                    width: 64,
                    height: 64,
                    mx: "auto",
                    mb: 1,
                    fontSize: "1.3rem",
                    fontWeight: 800,
                    backgroundColor: COLORS.primaryDark,
                    color: "#FFFFFF",
                    border: `3px solid ${COLORS.primarySoft}`,
                  }}
                >
                  {getInitials(viewDetails.full_name)}
                </Avatar>
                <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: COLORS.textPrimary }}>
                  {viewDetails.full_name}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: COLORS.textMuted }}>
                  @{viewDetails.username}
                </Typography>
                <Box sx={{ mt: 1, display: "flex", justifyContent: "center", gap: 1 }}>
                  {viewDetails.role_name && (
                    <Chip
                      label={viewDetails.role_name}
                      size="small"
                      sx={{
                        backgroundColor: getRoleChipConfig(viewDetails.role_id, viewDetails.role_name).bg,
                        color: getRoleChipConfig(viewDetails.role_id, viewDetails.role_name).color,
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        height: 22,
                      }}
                    />
                  )}
                  <Chip
                    label={viewDetails.status || "Active"}
                    size="small"
                    sx={{
                      backgroundColor: viewDetails.status === STATUS_INACTIVE ? COLORS.dangerSoft : COLORS.successSoft,
                      color: viewDetails.status === STATUS_INACTIVE ? COLORS.danger : COLORS.success,
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      height: 22,
                    }}
                  />
                </Box>
              </Box>

              {/* Detail Items */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[
                  { icon: <MailOutlineRoundedIcon sx={{ fontSize: "0.95rem" }} />, label: "Email Address", value: viewDetails.email },
                  { icon: <CallOutlinedIcon sx={{ fontSize: "0.95rem" }} />, label: "Phone Number", value: viewDetails.phone || "N/A" },
                  { icon: <BadgeOutlinedIcon sx={{ fontSize: "0.95rem" }} />, label: "User ID", value: `#${viewDetails.id}` },
                  { icon: <GroupsOutlinedIcon sx={{ fontSize: "0.95rem" }} />, label: "Reporting Manager", value: viewDetails.manager_name || "Direct Admin" },
                  { icon: <EventOutlinedIcon sx={{ fontSize: "0.95rem" }} />, label: "Account Created", value: formatDateTime(viewDetails.created_at) },
                  { icon: <LoginOutlinedIcon sx={{ fontSize: "0.95rem" }} />, label: "Last Active", value: formatDateTime(viewDetails.last_login) },
                ].map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.2,
                      p: 1.2,
                      borderRadius: "8px",
                      backgroundColor: "#F8FAFC",
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: COLORS.primarySoft, color: COLORS.primary }}>
                      {item.icon}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: "0.64rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: COLORS.textPrimary, wordBreak: "break-word" }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.8,
            borderTop: `1px solid ${COLORS.border}`,
            backgroundColor: "#FAFBFD",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button variant="outlined" size="small" onClick={() => setModalMode(null)} sx={outlinedButtonSx}>
            Close
          </Button>
          {viewDetails && (
            <Tooltip
              title={
                currentUserId !== null &&
                currentUserId !== undefined &&
                String(viewDetails.id) === String(currentUserId)
                  ? SELF_ACTION_TOOLTIP
                  : ""
              }
            >
              <span>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
                  disabled={
                    currentUserId !== null &&
                    currentUserId !== undefined &&
                    String(viewDetails.id) === String(currentUserId)
                  }
                  onClick={() => {
                    setModalMode(null);
                    setTimeout(() => handleOpenEditModal(viewDetails), 150);
                  }}
                  sx={primaryButtonSx}
                >
                  Edit Profile
                </Button>
              </span>
            </Tooltip>
          )}
        </DialogActions>
      </Dialog>

      {/* ================= 8. DELETE CONFIRMATION DIALOG POPUP ================= */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteDialogOpen(false);
            setUserToDelete(null);
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: "14px",
            p: 1,
            maxWidth: 380,
            width: "100%",
            boxShadow: "0 20px 40px rgba(11, 58, 99, 0.16)",
          },
        }}
      >
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "12px",
              backgroundColor: COLORS.dangerSoft,
              color: COLORS.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 1.5,
            }}
          >
            <WarningAmberOutlinedIcon sx={{ fontSize: "1.8rem" }} />
          </Box>
          <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem", color: COLORS.textPrimary, p: 0, mb: 0.5 }}>
            Delete User Account?
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <DialogContentText sx={{ fontSize: "0.82rem", color: COLORS.textSecondary }}>
              Are you sure you want to deactivate and remove{" "}
              <Box component="span" sx={{ fontWeight: 700, color: COLORS.textPrimary }}>
                {userToDelete?.full_name}
              </Box>
              ? This user will immediately lose access to the CRM platform.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 0, mt: 2.5, gap: 1, justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              disabled={deleting}
              sx={outlinedButtonSx}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmDelete}
              disabled={deleting}
              startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />}
              sx={{
                ...primaryButtonSx,
                backgroundColor: COLORS.danger,
                "&:hover": {
                  backgroundColor: "#B91C1C",
                },
              }}
            >
              {deleting ? "Deleting..." : "Yes, Delete User"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ================= 9. SNACKBAR NOTIFICATIONS ================= */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            fontWeight: 600,
            fontSize: "0.8rem",
            borderRadius: "8px",
          }}
          iconMapping={{
            success: <CheckCircleOutlineOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
            error: <ErrorOutlineOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
            warning: <WarningAmberOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
            info: <InfoOutlinedIcon sx={{ fontSize: "1.1rem" }} />,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
