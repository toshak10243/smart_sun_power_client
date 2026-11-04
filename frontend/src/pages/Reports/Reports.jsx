import React, { useState, useEffect, useMemo } from "react";
import { getUsers } from "../../services/userServices";
import { getLeads } from "../../services/leadService";

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
  Chip,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
  Button,
  Card,
  CardContent,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  Stack,
  TablePagination,
  Divider,
  TextField,
  InputAdornment,
  Breadcrumbs,
  Skeleton,
} from "@mui/material";

// Recharts for High-Impact Analytics
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

// Icons
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import SourceOutlinedIcon from "@mui/icons-material/SourceOutlined";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import ElectricBoltOutlinedIcon from "@mui/icons-material/ElectricBoltOutlined";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import PieChartOutlineRoundedIcon from "@mui/icons-material/PieChartOutlineRounded";

import ClosedLeadsReport from "../../components/ClosedLeadsReport";
import logo from "../../assets/images/logo.png";

// ═══════════════════════════════════════════════════════════
// COLOR THEME SYSTEM (Executive Deep Navy & Solar Blue)
// ═══════════════════════════════════════════════════════════
const COLORS = {
  primary: "#005BAC",
  primaryDark: "#0B3A63",
  primarySoft: "#E0F2FE",
  accent: "#0284C7",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  success: "#16A34A",
  successSoft: "#DCFCE7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  indigo: "#4F46E5",
  indigoSoft: "#EEF2FF",
  purple: "#7C3AED",
  purpleSoft: "#EDE9FE",
  teal: "#0D9488",
  tealSoft: "#CCFBF1",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

const CAPACITY_COLORS = ["#005BAC", "#0284C7", "#0D9488", "#7C3AED"];
const PIE_COLORS = ["#005BAC", "#16A34A", "#D97706", "#7C3AED", "#DC2626", "#0284C7", "#E11D48", "#059669"];

const PERIOD_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "this_year", label: "This Year" },
];

const getPeriodRange = (p) => {
  const n = new Date();
  if (p === "today") {
    const s = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return { start: s, end: n };
  }
  if (p === "this_week") {
    const day = n.getDay();
    const diff = n.getDate() - day + (day === 0 ? -6 : 1);
    const s = new Date(n.setDate(diff));
    s.setHours(0, 0, 0, 0);
    return { start: s, end: new Date() };
  }
  if (p === "this_month") {
    return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: n };
  }
  if (p === "last_month") {
    return {
      start: new Date(n.getFullYear(), n.getMonth() - 1, 1),
      end: new Date(n.getFullYear(), n.getMonth(), 0, 23, 59, 59),
    };
  }
  if (p === "this_quarter") {
    const q = Math.floor(n.getMonth() / 3);
    return { start: new Date(n.getFullYear(), q * 3, 1), end: n };
  }
  if (p === "this_year") {
    return { start: new Date(n.getFullYear(), 0, 1), end: n };
  }
  return null;
};

const formatINR = (v) => {
  const n = Number(v) || 0;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const p = name.trim().split(" ");
  return p.length === 1
    ? p[0].charAt(0).toUpperCase()
    : (p[0].charAt(0) + p[p.length - 1].charAt(0)).toUpperCase();
};

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

const resolveAvatar = (img) => {
  if (!img || typeof img !== "string" || img === "null" || img === "undefined") return null;
  if (img.startsWith("http")) return img;
  let clean = img.startsWith("/") ? img.slice(1) : img;
  if (!clean.startsWith("uploads/profiles/")) {
    clean = clean.startsWith("uploads/") ? clean.replace("uploads/", "uploads/profiles/") : `uploads/profiles/${clean}`;
  }
  return `${API_BASE_URL}/${clean}`;
};

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════
const UserAvatar = ({ user, size = 38 }) => {
  const photoUrl = resolveAvatar(user?.profile_image);
  return (
    <Avatar
      src={photoUrl || undefined}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        backgroundColor: COLORS.primaryDark,
        color: "#FFFFFF",
        fontWeight: 800,
        fontSize: size * 0.38,
        border: `1.5px solid ${COLORS.border}`,
      }}
    >
      {getInitials(user?.full_name)}
    </Avatar>
  );
};

const MetricCard = ({ label, value, caption, icon, color, softColor, loading }) => (
  <Card
    elevation={0}
    sx={{
      flex: "1 1 200px",
      borderRadius: "14px",
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.card,
      boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        boxShadow: `0 8px 24px ${color}14`,
        transform: "translateY(-2px)",
        borderColor: color,
      },
    }}
  >
    <CardContent sx={{ p: "16px 18px", "&:last-child": { pb: "16px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography
          sx={{
            color: COLORS.textSecondary,
            fontWeight: 700,
            fontSize: "0.68rem",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
        <Avatar sx={{ width: 32, height: 32, borderRadius: "8px", bgcolor: softColor, color: color }}>
          {icon}
        </Avatar>
      </Box>
      <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: "1.3rem", lineHeight: 1.2 }}>
        {loading ? <Skeleton width={60} height={30} /> : value}
      </Typography>
      <Typography sx={{ color: COLORS.textSecondary, mt: 0.4, display: "block", fontWeight: 500, fontSize: "0.72rem" }}>
        {caption}
      </Typography>
    </CardContent>
  </Card>
);

const ConversionCell = ({ rate }) => {
  const n = Number(rate);
  const barColor = n >= 25 ? COLORS.success : n >= 12 ? COLORS.warning : COLORS.danger;
  const chipBg = n >= 25 ? COLORS.successSoft : n >= 12 ? COLORS.warningSoft : COLORS.dangerSoft;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 140 }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(n, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "#F1F5F9",
            "& .MuiLinearProgress-bar": { backgroundColor: barColor, borderRadius: 3 },
          }}
        />
      </Box>
      <Chip
        label={`${rate}%`}
        size="small"
        sx={{
          fontWeight: 800,
          fontSize: "0.68rem",
          height: 22,
          minWidth: 46,
          backgroundColor: chipBg,
          color: barColor,
          borderRadius: "6px",
        }}
      />
    </Box>
  );
};

const TH = ({ children, align = "left", minWidth }) => (
  <TableCell
    align={align}
    sx={{
      fontWeight: 800,
      color: "#475569",
      fontSize: "0.72rem",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      py: 1.5,
      px: 2,
      whiteSpace: "nowrap",
      minWidth: minWidth,
      borderBottom: `2px solid ${COLORS.border}`,
      backgroundColor: "#F8FAFC",
    }}
  >
    {children}
  </TableCell>
);

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [period, setPeriod] = useState("all");
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, usersRes] = await Promise.all([
        getLeads({ page: 1, limit: 5000 }),
        getUsers({ limit: 200 }),
      ]);
      const lRaw = leadsRes?.data;
      setLeads(Array.isArray(lRaw) ? lRaw : lRaw?.data || []);
      const uRaw = usersRes?.data;
      setUsers(Array.isArray(uRaw) ? uRaw : uRaw?.data || []);
    } catch (err) {
      console.error("Error loading performance report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Leads by Period
  const filteredLeads = useMemo(() => {
    const range = getPeriodRange(period);
    if (!range) return leads;
    return leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= range.start && d <= range.end;
    });
  }, [leads, period]);

  // Overall Organization Summary Metrics
  const orgSummary = useMemo(() => {
    const total = filteredLeads.length;
    const won = filteredLeads.filter((l) => l.status === "Won").length;
    const lost = filteredLeads.filter((l) => l.status === "Lost" || l.status === "Not Interested").length;
    const active = total - won - lost;
    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
    const lostRate = total > 0 ? ((lost / total) * 100).toFixed(1) : "0.0";
    const revenue = filteredLeads
      .filter((l) => l.status === "Won")
      .reduce((acc, l) => acc + (Number(l.quotation_amount) || 0), 0);
    const capacityKw = filteredLeads
      .filter((l) => l.status === "Won")
      .reduce((acc, l) => acc + (Number(l.required_kw) || 0), 0);
    const avgDeal = won > 0 ? Math.round(revenue / won) : 0;
    return { total, won, lost, active, conversionRate, lostRate, revenue, capacityKw, avgDeal };
  }, [filteredLeads]);

  // User Roles
  const managers = useMemo(() => {
    return users.filter((u) => Number(u.role_id) === 2 || String(u.role_name || "").toLowerCase().includes("manager"));
  }, [users]);

  const reps = useMemo(() => {
    return users.filter((u) => Number(u.role_id) === 3 || String(u.role_name || "").toLowerCase().includes("sales"));
  }, [users]);

  // Manager Performance Directory Data
  const managerReports = useMemo(() => {
    return managers
      .map((mgr) => {
        const teamRepIds = reps.filter((r) => Number(r.manager_id) === Number(mgr.id)).map((r) => r.id);
        const teamLeads = filteredLeads.filter(
          (l) =>
            teamRepIds.includes(l.assigned_to) ||
            Number(l.assigned_to) === Number(mgr.id) ||
            Number(l.created_by) === Number(mgr.id)
        );
        const total = teamLeads.length;
        const won = teamLeads.filter((l) => l.status === "Won").length;
        const lost = teamLeads.filter((l) => l.status === "Lost" || l.status === "Not Interested").length;
        const active = total - won - lost;
        const rate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
        const revenue = teamLeads
          .filter((l) => l.status === "Won")
          .reduce((acc, l) => acc + (Number(l.quotation_amount) || 0), 0);
        const capacityKw = teamLeads
          .filter((l) => l.status === "Won")
          .reduce((acc, l) => acc + (Number(l.required_kw) || 0), 0);
        const avgRepRevenue = teamRepIds.length > 0 ? Math.round(revenue / teamRepIds.length) : revenue;

        return {
          user: mgr,
          id: mgr.id,
          name: mgr.full_name,
          email: mgr.email,
          phone: mgr.phone,
          teamSize: teamRepIds.length,
          total,
          won,
          lost,
          active,
          rate,
          revenue,
          capacityKw,
          avgRepRevenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.won - a.won);
  }, [managers, reps, filteredLeads]);

  // Sales Rep Performance Data
  const repReports = useMemo(() => {
    return reps
      .map((rep) => {
        const repLeads = filteredLeads.filter((l) => Number(l.assigned_to) === Number(rep.id));
        const total = repLeads.length;
        const won = repLeads.filter((l) => l.status === "Won").length;
        const lost = repLeads.filter((l) => l.status === "Lost" || l.status === "Not Interested").length;
        const active = total - won - lost;
        const rate = total > 0 ? ((won / total) * 100).toFixed(1) : "0.0";
        const revenue = repLeads
          .filter((l) => l.status === "Won")
          .reduce((acc, l) => acc + (Number(l.quotation_amount) || 0), 0);
        const capacityKw = repLeads
          .filter((l) => l.status === "Won")
          .reduce((acc, l) => acc + (Number(l.required_kw) || 0), 0);
        const managerName =
          rep.manager_name ||
          managers.find((m) => Number(m.id) === Number(rep.manager_id))?.full_name ||
          "Direct Admin";

        // Performance Tier Badge
        let tier = "Standard";
        let tierColor = COLORS.textSecondary;
        let tierBg = "#F1F5F9";
        if (won >= 8 || revenue >= 1000000) {
          tier = "Top Producer";
          tierColor = COLORS.warning;
          tierBg = COLORS.warningSoft;
        } else if (won >= 3 || rate >= 15) {
          tier = "High Velocity";
          tierColor = COLORS.success;
          tierBg = COLORS.successSoft;
        } else if (lost > 10 && won === 0) {
          tier = "Needs Coaching";
          tierColor = COLORS.danger;
          tierBg = COLORS.dangerSoft;
        }

        return {
          user: rep,
          id: rep.id,
          name: rep.full_name,
          email: rep.email,
          phone: rep.phone,
          managerName,
          total,
          won,
          lost,
          active,
          rate,
          revenue,
          capacityKw,
          tier,
          tierColor,
          tierBg,
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.won - a.won);
  }, [reps, filteredLeads, managers]);

  // Lead Source Performance
  const sourcePerformance = useMemo(() => {
    const map = {};
    filteredLeads.forEach((l) => {
      const src = l.lead_source || "Website";
      if (!map[src]) map[src] = { total: 0, won: 0, lost: 0, revenue: 0 };
      map[src].total += 1;
      if (l.status === "Won") {
        map[src].won += 1;
        map[src].revenue += Number(l.quotation_amount) || 0;
      } else if (l.status === "Lost" || l.status === "Not Interested") {
        map[src].lost += 1;
      }
    });
    return Object.entries(map)
      .map(([source, v]) => ({
        source,
        ...v,
        active: v.total - v.won - v.lost,
        rate: v.total > 0 ? Math.round((v.won / v.total) * 100) : 0,
        avgDeal: v.won > 0 ? Math.round(v.revenue / v.won) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredLeads]);

  // Stage Distribution
  const stageDistribution = useMemo(() => {
    const map = {};
    filteredLeads.forEach((l) => {
      const st = l.status || "New Lead";
      map[st] = (map[st] || 0) + 1;
    });
    return Object.entries(map)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  // System Capacity Breakdown
  const capacityBreakdown = useMemo(() => {
    const buckets = [
      { bucket: "1-3 kW (Small)", count: 0 },
      { bucket: "3-5 kW (Standard)", count: 0 },
      { bucket: "5-10 kW (Large)", count: 0 },
      { bucket: ">10 kW (Commercial)", count: 0 },
    ];
    filteredLeads.forEach((l) => {
      const kw = Number(l.required_kw) || 0;
      if (kw <= 0) return;
      if (kw <= 3) buckets[0].count += 1;
      else if (kw <= 5) buckets[1].count += 1;
      else if (kw <= 10) buckets[2].count += 1;
      else buckets[3].count += 1;
    });
    return buckets;
  }, [filteredLeads]);

  // Monthly Revenue & Won Trajectory (Last 6 Months)
  const monthlyTrajectory = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const leadsInMonth = leads.filter((l) => {
        const ld = new Date(l.created_at);
        return ld.getFullYear() === year && ld.getMonth() === monthIdx;
      });
      const wonInMonth = leadsInMonth.filter((l) => l.status === "Won");
      const revLakhs =
        Math.round(
          (wonInMonth.reduce((acc, l) => acc + (Number(l.quotation_amount) || 0), 0) / 100000) * 100
        ) / 100;
      months.push({
        month: mName,
        total: leadsInMonth.length,
        won: wonInMonth.length,
        revenue_lakhs: revLakhs,
      });
    }
    return months;
  }, [leads]);

  // Filtered Table Rows by Search Query
  const filteredManagerRows = useMemo(() => {
    if (!search.trim()) return managerReports;
    const q = search.toLowerCase();
    return managerReports.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.phone && m.phone.includes(q))
    );
  }, [managerReports, search]);

  const filteredRepRows = useMemo(() => {
    if (!search.trim()) return repReports;
    const q = search.toLowerCase();
    return repReports.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.managerName && r.managerName.toLowerCase().includes(q))
    );
  }, [repReports, search]);

  const pagedRepRows = useMemo(() => {
    return filteredRepRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredRepRows, page, rowsPerPage]);

  const pagedManagerRows = useMemo(() => {
    return filteredManagerRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredManagerRows, page, rowsPerPage]);

  // CSV Export Action
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = "";

    if (activeTab === 0) {
      filename = `Solar_CRM_Manager_Performance_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        "Manager Name",
        "Email",
        "Phone",
        "Team Size",
        "Total Pipeline",
        "Active Leads",
        "Deals Won",
        "Deals Lost",
        "Conversion Rate (%)",
        "Installed kW",
        "Revenue Won (INR)",
        "Avg Rep Output (INR)",
      ];
      rows = managerReports.map((m) => [
        `"${m.name}"`,
        `"${m.email}"`,
        `"${m.phone || ""}"`,
        m.teamSize,
        m.total,
        m.active,
        m.won,
        m.lost,
        `"${m.rate}%"`,
        m.capacityKw,
        m.revenue,
        m.avgRepRevenue,
      ]);
    } else if (activeTab === 1) {
      filename = `Solar_CRM_Rep_Performance_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = [
        "Sales Rep",
        "Email",
        "Phone",
        "Reporting Manager",
        "Total Assigned",
        "Active Deals",
        "Deals Won",
        "Deals Lost",
        "Conversion Rate (%)",
        "Capacity Won (kW)",
        "Revenue Generated (INR)",
        "Performance Tier",
      ];
      rows = repReports.map((r) => [
        `"${r.name}"`,
        `"${r.email}"`,
        `"${r.phone || ""}"`,
        `"${r.managerName}"`,
        r.total,
        r.active,
        r.won,
        r.lost,
        `"${r.rate}%"`,
        r.capacityKw,
        r.revenue,
        `"${r.tier}"`,
      ]);
    } else {
      filename = `Solar_CRM_Source_ROI_${new Date().toISOString().slice(0, 10)}.csv`;
      headers = ["Lead Source", "Total Inquiries", "Active", "Won", "Lost", "Conversion Rate (%)", "Revenue Won (INR)", "Avg Deal Size (INR)"];
      rows = sourcePerformance.map((s) => [
        `"${s.source}"`,
        s.total,
        s.active,
        s.won,
        s.lost,
        `"${s.rate}%"`,
        s.revenue,
        s.avgDeal,
      ]);
    }

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print / PDF Export Action
  const handleExportPDF = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const dateStr = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const periodName = PERIOD_OPTIONS.find((p) => p.value === period)?.label || "All Time";

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Solar CRM Executive Intelligence Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #0F172A; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #005BAC; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: 800; color: #0B3A63; margin: 0; }
          .sub { font-size: 12px; color: #64748B; margin-top: 4px; }
          .kpi-grid { display: flex; gap: 12px; margin-bottom: 25px; }
          .kpi-box { flex: 1; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; background: #F8FAFC; text-align: center; }
          .kpi-lbl { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; }
          .kpi-val { font-size: 20px; font-weight: 800; color: #005BAC; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; font-size: 12px; }
          th { background-color: #0B3A63; color: #FFF; text-align: left; padding: 9px 12px; font-size: 11px; text-transform: uppercase; }
          td { padding: 9px 12px; border-bottom: 1px solid #E2E8F0; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .badge { padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
          .badge-won { background: #DCFCE7; color: #16A34A; }
          .badge-lost { background: #FEE2E2; color: #DC2626; }
          .footer { margin-top: 35px; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">SMART SUN POWER CRM — EXECUTIVE INTELLIGENCE REPORT</h1>
            <p class="sub">Filter Period: <strong>${periodName}</strong> | Report Generation Date: <strong>${dateStr}</strong></p>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-box"><div class="kpi-lbl">Total Pipeline</div><div class="kpi-val">${orgSummary.total}</div></div>
          <div class="kpi-box"><div class="kpi-lbl">Deals Won</div><div class="kpi-val" style="color: #16A34A;">${orgSummary.won}</div></div>
          <div class="kpi-box"><div class="kpi-lbl">Installed Capacity</div><div class="kpi-val" style="color: #0D9488;">${orgSummary.capacityKw} kW</div></div>
          <div class="kpi-box"><div class="kpi-lbl">Gross Revenue</div><div class="kpi-val" style="color: #D97706;">${formatINR(orgSummary.revenue)}</div></div>
          <div class="kpi-box"><div class="kpi-lbl">Conversion Efficiency</div><div class="kpi-val">${orgSummary.conversionRate}%</div></div>
        </div>

        <h3 style="color: #0B3A63; margin-bottom: 6px;">Manager Performance Directory</h3>
        <table>
          <thead>
            <tr>
              <th>Manager Name</th>
              <th>Team Reps</th>
              <th>Total Leads</th>
              <th>Active</th>
              <th>Won</th>
              <th>Lost</th>
              <th>Conversion</th>
              <th>Revenue Won</th>
            </tr>
          </thead>
          <tbody>
            ${managerReports
              .map(
                (m) => `
              <tr>
                <td><strong>${m.name}</strong><br/><span style="color:#64748B;font-size:10px;">${m.email}</span></td>
                <td>${m.teamSize} Reps</td>
                <td>${m.total}</td>
                <td>${m.active}</td>
                <td><span class="badge badge-won">${m.won}</span></td>
                <td><span class="badge badge-lost">${m.lost}</span></td>
                <td><strong>${m.rate}%</strong></td>
                <td><strong>${formatINR(m.revenue)}</strong></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <h3 style="color: #0B3A63; margin-bottom: 6px; margin-top: 30px;">Sales Representatives Conversion Matrix</h3>
        <table>
          <thead>
            <tr>
              <th>Sales Rep</th>
              <th>Reporting Manager</th>
              <th>Total Assigned</th>
              <th>Won</th>
              <th>Lost</th>
              <th>Conversion</th>
              <th>Capacity (kW)</th>
              <th>Revenue Won</th>
            </tr>
          </thead>
          <tbody>
            ${repReports
              .map(
                (r) => `
              <tr>
                <td><strong>${r.name}</strong><br/><span style="color:#64748B;font-size:10px;">${r.email}</span></td>
                <td>${r.managerName}</td>
                <td>${r.total}</td>
                <td><span class="badge badge-won">${r.won}</span></td>
                <td><span class="badge badge-lost">${r.lost}</span></td>
                <td><strong>${r.rate}%</strong></td>
                <td>${r.capacityKw} kW</td>
                <td><strong>${formatINR(r.revenue)}</strong></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">Smart Sun Power CRM — Confidential Analytics and Performance Intelligence Audit.</div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label || "All Time";

  return (
    <Box
      style={{ zoom: 0.90 }}
      sx={{
        backgroundColor: COLORS.bg,
        minHeight: "100vh",
        p: { xs: 1.5, sm: 2.5 },
        width: "100%",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
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
            Analytics
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.primary }}>
            Performance Reports
          </Typography>
        </Breadcrumbs>

        {/* ================= 2. TOP HERO HEADER & CONTROLS ================= */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
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
                Executive Performance & Conversion Reports
              </Typography>
              <Chip
                icon={<SpeedRoundedIcon sx={{ fontSize: "13px !important" }} />}
                label="Live Synced"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  backgroundColor: COLORS.successSoft,
                  color: COLORS.success,
                  border: "1px solid #BBF7D0",
                  borderRadius: "8px",
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: COLORS.textSecondary, mt: 0.3, fontSize: "0.78rem" }} noWrap>
              Cross-team analytics, manager & sales representative conversion rates, pipeline velocity & exportable audits.
            </Typography>
          </Box>

          {/* Action Toolbar */}
          <Stack direction="row" alignItems="center" gap={1.2} sx={{ flexWrap: "nowrap", flexShrink: 0 }}>
            {/* Period Filter Dropdown */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.8,
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                px: 1.2,
                py: "3px",
                border: `1px solid ${COLORS.border}`,
                height: 36,
                boxSizing: "border-box",
              }}
            >
              <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: COLORS.textSecondary }} />
              <FormControl size="small" variant="standard">
                <Select
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value);
                    setPage(0);
                  }}
                  disableUnderline
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    "& .MuiSelect-select": { py: 0.2, pr: "20px !important" },
                  }}
                >
                  {PERIOD_OPTIONS.map((p) => (
                    <MenuItem key={p.value} value={p.value} sx={{ fontSize: "0.78rem" }}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Refresh Button */}
            <Tooltip title="Refresh Reports">
              <span>
                <IconButton
                  onClick={fetchData}
                  disabled={loading}
                  size="small"
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    border: `1px solid ${COLORS.border}`,
                    backgroundColor: "#FFFFFF",
                    color: COLORS.primary,
                    "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F1F5F9" },
                  }}
                >
                  <RefreshRoundedIcon
                    sx={{
                      fontSize: 18,
                      animation: loading ? "spin 0.9s linear infinite" : "none",
                      "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>

            {/* Export CSV Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={handleExportCSV}
              sx={{
                height: 36,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.76rem",
                px: 1.6,
                whiteSpace: "nowrap",
                borderColor: COLORS.border,
                backgroundColor: COLORS.card,
                color: COLORS.textPrimary,
                "&:hover": { borderColor: COLORS.primary, backgroundColor: "#F1F5F9" },
              }}
            >
              Export CSV
            </Button>

            {/* Print / PDF Button */}
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={handleExportPDF}
              sx={{
                height: 36,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.76rem",
                px: 1.8,
                whiteSpace: "nowrap",
                backgroundColor: COLORS.primary,
                color: "#FFFFFF",
                boxShadow: "0 2px 6px rgba(0,91,172,0.18)",
                "&:hover": {
                  backgroundColor: COLORS.primaryDark,
                },
              }}
            >
              Print / PDF
            </Button>
          </Stack>
        </Box>

        {/* ================= 3. EXECUTIVE KPI CARDS (TOP 5 METRICS ROW) ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              lg: "repeat(5, 1fr)",
            },
            gap: 2,
            mb: 3.5,
            width: "100%",
          }}
        >
          <MetricCard
            label="Total Inquiries"
            value={orgSummary.total.toLocaleString()}
            caption={`${orgSummary.active} currently in active funnel`}
            icon={<TrendingUpRoundedIcon sx={{ fontSize: 19 }} />}
            color={COLORS.primary}
            softColor={COLORS.primarySoft}
            loading={loading}
          />
          <MetricCard
            label="Deals Won"
            value={orgSummary.won.toLocaleString()}
            caption={`${orgSummary.capacityKw.toFixed(1)} kW installed capacity`}
            icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 19 }} />}
            color={COLORS.success}
            softColor={COLORS.successSoft}
            loading={loading}
          />
          <MetricCard
            label="Gross Realized Revenue"
            value={formatINR(orgSummary.revenue)}
            caption={`Avg deal size: ${formatINR(orgSummary.avgDeal)}`}
            icon={<CurrencyRupeeRoundedIcon sx={{ fontSize: 19 }} />}
            color={COLORS.warning}
            softColor={COLORS.warningSoft}
            loading={loading}
          />
          <MetricCard
            label="Conversion Efficiency"
            value={`${orgSummary.conversionRate}%`}
            caption={`${periodLabel} conversion benchmark`}
            icon={<SpeedRoundedIcon sx={{ fontSize: 19 }} />}
            color={COLORS.indigo}
            softColor={COLORS.indigoSoft}
            loading={loading}
          />
          <MetricCard
            label="Lost & Drop-off Leads"
            value={orgSummary.lost.toLocaleString()}
            caption={`${orgSummary.lostRate}% pipeline loss rate`}
            icon={<CancelOutlinedIcon sx={{ fontSize: 19 }} />}
            color={COLORS.danger}
            softColor={COLORS.dangerSoft}
            loading={loading}
          />
        </Box>

        {/* ================= 4. INTERACTIVE VISUALIZATIONS (2x2 ANALYTICS GRID) ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" },
            gap: 2.5,
            mb: 3.5,
            width: "100%",
          }}
        >
          {/* Chart 1: Monthly Conversion & Revenue Trajectory */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                  Monthly Conversion & Revenue Trajectory
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                  Revenue realization (₹ Lakhs) vs closed deals won over time
                </Typography>
              </Box>
              <Chip
                label="Financial Velocity"
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
                  <ComposedChart data={monthlyTrajectory} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.textSecondary, fontWeight: 600 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: COLORS.textSecondary }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: COLORS.teal }} />
                    <RechartsTooltip
                      formatter={(val, name) => [
                        name === "Revenue (₹ Lakhs)" ? `₹${val} L` : `${val} Deals`,
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
                      dataKey="won"
                      stroke={COLORS.success}
                      strokeWidth={3}
                      dot={{ r: 4, fill: COLORS.success }}
                      name="Deals Won"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>

          {/* Chart 2: System Capacity Demand Distribution */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                  System Capacity Spectrum
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                  Solar kW size demand breakdown
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

            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
              <Box sx={{ height: 160, width: "100%" }}>
                {loading ? (
                  <Skeleton variant="circular" width={140} height={140} sx={{ mx: "auto", my: 1 }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={capacityBreakdown}
                        dataKey="count"
                        nameKey="bucket"
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {capacityBreakdown.map((_, index) => (
                          <Cell key={`cap-c-${index}`} fill={CAPACITY_COLORS[index % CAPACITY_COLORS.length]} />
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
                )}
              </Box>

              {/* Clean 2-Column Badges Grid */}
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
                      {item.count}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* ================= 5. SECOND CHARTS ROW: STAGE BREAKDOWN & SOURCE PERFORMANCE ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: 2.5,
            mb: 3.5,
            width: "100%",
          }}
        >
          {/* Chart 3: Pipeline Stage Breakdown Donut */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                  Pipeline Stage Concentration
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                  Stage-wise customer volume distribution
                </Typography>
              </Box>
              <Chip
                label={`${orgSummary.conversionRate}% Won`}
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

            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
              <Box sx={{ height: 160, width: "100%" }}>
                {loading ? (
                  <Skeleton variant="circular" width={140} height={140} sx={{ mx: "auto", my: 1 }} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stageDistribution}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {stageDistribution.map((_, index) => (
                          <Cell key={`stage-c-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                )}
              </Box>

              {/* Clean 2-Column Badges Grid */}
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
                {stageDistribution
                  .filter((item) => Number(item.count) > 0)
                  .map((item, idx) => (
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
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                            flexShrink: 0,
                          }}
                        />
                        <Typography sx={{ fontSize: "0.72rem", color: COLORS.textSecondary, fontWeight: 500 }} noWrap>
                          {item.status}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: COLORS.textPrimary, flexShrink: 0 }}>
                        {item.count}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Box>
          </Paper>

          {/* Chart 4: Lead Source Acquisition Performance */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "14px",
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.card,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: COLORS.textPrimary }}>
                  Lead Source Volume & Won Conversion
                </Typography>
                <Typography sx={{ fontSize: "0.74rem", color: COLORS.textSecondary }}>
                  Acquisition channel effectiveness & closed orders
                </Typography>
              </Box>
              <Chip
                icon={<SourceOutlinedIcon sx={{ fontSize: "14px !important" }} />}
                label="Acquisition ROI"
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

            <Box sx={{ height: 260, width: "100%" }}>
              {loading ? (
                <Skeleton variant="rounded" height="100%" sx={{ borderRadius: "10px" }} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sourcePerformance.slice(0, 6)} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="source" tick={{ fontSize: 11, fill: COLORS.textSecondary, fontWeight: 600 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: COLORS.textSecondary }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: COLORS.success }} />
                    <RechartsTooltip
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
                      dataKey="total"
                      fill={COLORS.primary}
                      radius={[6, 6, 0, 0]}
                      name="Total Inquiries"
                      barSize={20}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="won"
                      stroke={COLORS.success}
                      strokeWidth={3}
                      dot={{ r: 4, fill: COLORS.success }}
                      name="Won Orders"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Box>

        {/* ================= 6. COMPREHENSIVE DATA TABLES (MULTI-TAB INTELLIGENCE) ================= */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: "14px",
            border: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.card,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
          }}
        >
          {/* Table Header Controls & Tab Bar */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${COLORS.border}`,
              backgroundColor: "#FAFBFD",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            {/* Tabs Navigation */}
            <Tabs
              value={activeTab}
              onChange={(_, val) => {
                setActiveTab(val);
                setPage(0);
              }}
              sx={{
                minHeight: 38,
                "& .MuiTab-root": {
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textTransform: "none",
                  minHeight: 38,
                  py: 0.5,
                  px: 2,
                  borderRadius: "8px",
                  color: COLORS.textSecondary,
                  transition: "all 0.15s ease",
                  "&.Mui-selected": {
                    color: COLORS.primaryDark,
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 1px 3px rgba(0, 91, 172, 0.12)",
                  },
                },
                "& .MuiTabs-indicator": { display: "none" },
              }}
            >
              <Tab
                icon={<SupervisorAccountOutlinedIcon sx={{ fontSize: 17 }} />}
                iconPosition="start"
                label={`By Manager (${managerReports.length})`}
              />
              <Tab
                icon={<PersonOutlineRoundedIcon sx={{ fontSize: 17 }} />}
                iconPosition="start"
                label={`By Sales Rep (${repReports.length})`}
              />
              <Tab
                icon={<SourceOutlinedIcon sx={{ fontSize: 17 }} />}
                iconPosition="start"
                label={`By Source (${sourcePerformance.length})`}
              />
              <Tab
                icon={<CancelOutlinedIcon sx={{ fontSize: 17 }} />}
                iconPosition="start"
                label="Lost & Drop-off Audits"
              />
            </Tabs>

            {/* In-Table Search Filter */}
            {activeTab !== 3 && (
              <TextField
                size="small"
                placeholder="Search by name, email, manager..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon sx={{ fontSize: 18, color: COLORS.textSecondary }} />
                      </InputAdornment>
                    ),
                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearch("")}>
                          <ClearRoundedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
                sx={{
                  width: { xs: "100%", sm: 260 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    backgroundColor: "#FFFFFF",
                    fontSize: "0.76rem",
                    height: 34,
                  },
                }}
              />
            )}
          </Box>

          {/* TAB 0: BY MANAGER */}
          {activeTab === 0 && (
            <>
              <TableContainer
                sx={{
                  width: "100%",
                  overflowX: "auto",
                  "&::-webkit-scrollbar": { height: "7px" },
                  "&::-webkit-scrollbar-track": { backgroundColor: "#F1F5F9", borderRadius: "4px" },
                  "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
                }}
              >
                <Table size="small" sx={{ minWidth: 980, width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      <TH minWidth={220}>Manager Profile</TH>
                      <TH align="center" minWidth={110}>Team Reps</TH>
                      <TH align="center" minWidth={110}>Total Leads</TH>
                      <TH align="center" minWidth={110}>Active Funnel</TH>
                      <TH align="center" minWidth={100}>Deals Won</TH>
                      <TH align="center" minWidth={100}>Deals Lost</TH>
                      <TH minWidth={160}>Conversion Efficiency</TH>
                      <TH align="right" minWidth={150}>Revenue Won</TH>
                      <TH align="right" minWidth={150}>Avg Rep Output</TH>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array.from(new Array(4)).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={9} sx={{ py: 1.5 }}>
                            <Skeleton variant="rounded" height={36} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : pagedManagerRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} sx={{ textAlign: "center", py: 5, color: COLORS.textSecondary }}>
                          No manager performance records found for this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedManagerRows.map((m) => (
                        <TableRow
                          key={m.id}
                          hover
                          sx={{
                            "&:hover": { backgroundColor: "#F8FAFC" },
                            "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 1.2, px: 2 },
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" alignItems="center" gap={1.2}>
                              <UserAvatar user={m.user} size={36} />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary }} noWrap>
                                  {m.name}
                                </Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }} noWrap>
                                  {m.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${m.teamSize} Reps`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                height: 22,
                                backgroundColor: COLORS.purpleSoft,
                                color: COLORS.purple,
                                borderRadius: "6px",
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary }}>
                              {m.total}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: COLORS.primary }}>
                              {m.active}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${m.won} Won`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.68rem",
                                height: 22,
                                backgroundColor: COLORS.successSoft,
                                color: COLORS.success,
                                borderRadius: "6px",
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 600, fontSize: "0.78rem", color: COLORS.danger }}>
                              {m.lost}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <ConversionCell rate={m.rate} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: COLORS.primaryDark }}>
                              {formatINR(m.revenue)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.textSecondary }}>
                              {formatINR(m.avgRepRevenue)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 20, 50]}
                component="div"
                count={filteredManagerRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                sx={{
                  borderTop: `1px solid ${COLORS.border}`,
                  "& .MuiTablePagination-toolbar": { minHeight: 40, px: 2 },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: "0.74rem",
                    color: COLORS.textSecondary,
                  },
                }}
              />
            </>
          )}

          {/* TAB 1: BY SALES REP */}
          {activeTab === 1 && (
            <>
              <TableContainer
                sx={{
                  width: "100%",
                  overflowX: "auto",
                  "&::-webkit-scrollbar": { height: "7px" },
                  "&::-webkit-scrollbar-track": { backgroundColor: "#F1F5F9", borderRadius: "4px" },
                  "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
                }}
              >
                <Table size="small" sx={{ minWidth: 980, width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      <TH minWidth={210}>Sales Representative</TH>
                      <TH minWidth={160}>Reporting Manager</TH>
                      <TH align="center" minWidth={100}>Total Leads</TH>
                      <TH align="center" minWidth={100}>Active Funnel</TH>
                      <TH align="center" minWidth={95}>Won Deals</TH>
                      <TH align="center" minWidth={95}>Lost Leads</TH>
                      <TH minWidth={150}>Conversion Rate</TH>
                      <TH align="center" minWidth={110}>Capacity (kW)</TH>
                      <TH align="right" minWidth={140}>Revenue Won</TH>
                      <TH align="center" minWidth={130}>Performance Tier</TH>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      Array.from(new Array(4)).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={10} sx={{ py: 1.5 }}>
                            <Skeleton variant="rounded" height={36} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : pagedRepRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} sx={{ textAlign: "center", py: 5, color: COLORS.textSecondary }}>
                          No sales representative records found matching your query.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedRepRows.map((r) => (
                        <TableRow
                          key={r.id}
                          hover
                          sx={{
                            "&:hover": { backgroundColor: "#F8FAFC" },
                            "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 1.2, px: 2 },
                          }}
                        >
                          <TableCell>
                            <Stack direction="row" alignItems="center" gap={1.2}>
                              <UserAvatar user={r.user} size={36} />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary }} noWrap>
                                  {r.name}
                                </Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: COLORS.textSecondary }} noWrap>
                                  {r.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={r.managerName}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.72rem",
                                height: 22,
                                borderRadius: "6px",
                                backgroundColor: COLORS.purpleSoft,
                                color: COLORS.purple,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: COLORS.textPrimary }}>
                              {r.total}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: COLORS.primary }}>
                              {r.active}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${r.won} Won`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.68rem",
                                height: 22,
                                backgroundColor: COLORS.successSoft,
                                color: COLORS.success,
                                borderRadius: "6px",
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 600, fontSize: "0.78rem", color: COLORS.danger }}>
                              {r.lost}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <ConversionCell rate={r.rate} />
                          </TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.teal }}>
                              {r.capacityKw > 0 ? `${r.capacityKw.toFixed(1)} kW` : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: COLORS.primaryDark }}>
                              {formatINR(r.revenue)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={r.tier}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: "0.68rem",
                                height: 22,
                                backgroundColor: r.tierBg,
                                color: r.tierColor,
                                borderRadius: "6px",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={filteredRepRows.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                sx={{
                  borderTop: `1px solid ${COLORS.border}`,
                  "& .MuiTablePagination-toolbar": { minHeight: 40, px: 2 },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontSize: "0.74rem",
                    color: COLORS.textSecondary,
                  },
                }}
              />
            </>
          )}

          {/* TAB 2: BY SOURCE */}
          {activeTab === 2 && (
            <TableContainer
              sx={{
                width: "100%",
                overflowX: "auto",
                "&::-webkit-scrollbar": { height: "7px" },
                "&::-webkit-scrollbar-track": { backgroundColor: "#F1F5F9", borderRadius: "4px" },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
              }}
            >
              <Table size="small" sx={{ minWidth: 980, width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TH minWidth={200}>Marketing Source</TH>
                    <TH align="center" minWidth={120}>Total Inquiries</TH>
                    <TH align="center" minWidth={120}>Active Pipeline</TH>
                    <TH align="center" minWidth={110}>Won Orders</TH>
                    <TH align="center" minWidth={110}>Lost Leads</TH>
                    <TH minWidth={160}>Conversion Rate</TH>
                    <TH align="right" minWidth={160}>Revenue Generated</TH>
                    <TH align="right" minWidth={150}>Avg Order Size</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from(new Array(4)).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={8} sx={{ py: 1.5 }}>
                          <Skeleton variant="rounded" height={36} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : sourcePerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: "center", py: 5, color: COLORS.textSecondary }}>
                        No marketing source data found for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sourcePerformance.map((s, idx) => (
                      <TableRow
                        key={s.source}
                        hover
                        sx={{
                          "&:hover": { backgroundColor: "#F8FAFC" },
                          "& td": { borderBottom: `1px solid ${COLORS.border}`, py: 1.2, px: 2 },
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" gap={1.2}>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                              }}
                            />
                            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: COLORS.textPrimary }}>
                              {s.source}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: COLORS.textPrimary }}>
                            {s.total}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: COLORS.primary }}>
                            {s.active}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${s.won} Won`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.68rem",
                              height: 22,
                              backgroundColor: COLORS.successSoft,
                              color: COLORS.success,
                              borderRadius: "6px",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 600, fontSize: "0.8rem", color: COLORS.danger }}>
                            {s.lost}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <ConversionCell rate={s.rate} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: COLORS.primaryDark }}>
                            {formatINR(s.revenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: COLORS.textSecondary }}>
                            {formatINR(s.avgDeal)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* TAB 3: CLOSED LEADS AUDIT */}
          {activeTab === 3 && (
            <Box sx={{ p: 2 }}>
              <ClosedLeadsReport />
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
