import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// Central AuthContext import
import { useAuth } from "../../context/AuthContext";

import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Chip,
  Collapse,
} from "@mui/material";

// Material UI Icons
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import SolarPowerOutlinedIcon from "@mui/icons-material/SolarPowerOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import FolderSharedOutlinedIcon from "@mui/icons-material/FolderSharedOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";

import logo from "../../assets/images/logo.png";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

// Configurable Navigation Sections with Collapsible Lead Management
const navigationSections = [
  {
    category: "MAIN",
    items: [
      {
        title: "Dashboard",
        icon: <DashboardOutlinedIcon />,
        path: "/dashboard",
      },
    ],
  },
  {
    category: "SALES & LEADS",
    items: [
      {
        title: "Lead Management",
        icon: <SolarPowerOutlinedIcon />,
        isCollapsible: true,
        subItems: [
          {
            title: "Today's Follow-up",
            badge: "Daily",
            icon: <EventNoteOutlinedIcon />,
            path: "/leads/followups",
          },
          {
            title: "All Leads",
            icon: <FormatListBulletedOutlinedIcon />,
            path: "/leads",
          },
          {
            title: "+ Add Lead",
            icon: <PersonAddAlt1OutlinedIcon />,
            action: "openAddLead",
            path: "/leads",
          },
        ],
      },
      {
        title: "Manager Assignments",
        icon: <AssignmentIndOutlinedIcon />,
        path: "/manager-assignments",
      },
    ],
  },
  {
    category: "PROJECT EXECUTION",
    items: [
      {
        title: "Operations Analytics",
        icon: <SpeedRoundedIcon />,
        path: "/back-office/analytics",
      },
      {
        title: "Back-Office Operations",
        icon: <AssignmentTurnedInRoundedIcon />,
        path: "/back-office",
      },
      {
        title: "Project Documents",
        icon: <FolderSharedOutlinedIcon />,
        path: "/documents",
      },
    ],
  },
  {
    category: "ADMINISTRATION",
    items: [
      {
        title: "User Management",
        icon: <GroupOutlinedIcon />,
        path: "/users",
      },
      {
        title: "Reports",
        icon: <AssessmentOutlinedIcon />,
        path: "/reports",
      },
      {
        title: "Settings",
        icon: <SettingsOutlinedIcon />,
        path: "/settings",
      },
    ],
  },
];

// Helper Utility: Helper to generate 2-letter Initials from full name
const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const Sidebar = ({ mobileOpen, handleDrawerToggle, sidebarWidth = 280 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Lead Management collapsible state (open by default or when on /leads route)
  const isLeadRoute = location.pathname.startsWith("/leads");
  const [leadMgmtOpen, setLeadMgmtOpen] = useState(true);

  // React Context Real-time User & Logout
  const { user, logout } = useAuth();

  const fullName = user?.full_name || user?.name || "User";
  const roleName = user?.role_name || user?.role || "Administrator";
  const avatarInitials = getInitials(fullName);

  // Avatar Image URL Resolver
  const avatarSrc = useMemo(() => {
    const imgPath = user?.profile_image;
    if (!imgPath || imgPath === "null" || imgPath === "undefined" || imgPath.trim() === "") {
      return null;
    }

    if (imgPath.startsWith("http")) {
      return imgPath;
    }

    let cleanPath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;

    if (!cleanPath.startsWith("uploads/profiles/")) {
      if (cleanPath.startsWith("uploads/")) {
        cleanPath = cleanPath.replace("uploads/", "uploads/profiles/");
      } else {
        cleanPath = `uploads/profiles/${cleanPath}`;
      }
    }

    return `${API_BASE_URL}/${cleanPath}`;
  }, [user?.profile_image]);

  // Confirmed Logout Action
  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    if (logout) {
      logout();
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }
    navigate("/", { replace: true });
  };

  const isBackOfficeStaff =
    roleName.includes("Back Office") ||
    roleName.includes("Loan") ||
    roleName.includes("Accounts") ||
    roleName.includes("Installation") ||
    roleName.includes("Portal");

  // Filter sections and items based on role
  const visibleSections = useMemo(() => {
    return navigationSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (isBackOfficeStaff) {
            return item.path === "/back-office/analytics" || item.path === "/back-office";
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [isBackOfficeStaff]);

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0B3A63",
        color: "#FFFFFF",
        overflow: "hidden",
      }}
    >
      {/* 1. TOP BRAND LOGO HEADER: Exact 72px to align seamlessly with Navbar */}
      <Box
        sx={{
          height: 72,
          minHeight: 72,
          boxSizing: "border-box",
          px: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.8,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Solar CRM"
          sx={{ height: 38, width: "auto", flexShrink: 0 }}
        />
        <Box sx={{ overflow: "hidden", minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 800,
              lineHeight: 1.2,
              color: "#FFFFFF",
              fontSize: "1.02rem",
              letterSpacing: 0.2,
            }}
          >
            Solar CRM
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: "#38BDF8",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "block",
            }}
          >
            Sales Management Platform
          </Typography>
        </Box>
      </Box>

      {/* 2. MIDDLE NAVIGATION ITEMS: Categorized Sections with Custom Scrollbar */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          py: 1,
          px: 1.2,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255, 255, 255, 0.28) rgba(0, 0, 0, 0.12)",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(0, 0, 0, 0.12)",
            borderRadius: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255, 255, 255, 0.28)",
            borderRadius: "6px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            "&:hover": {
              backgroundColor: "#00B5EF",
            },
          },
        }}
      >
        {visibleSections.map((section, sIndex) => (
          <Box key={section.category || sIndex} sx={{ mb: 1.2 }}>
            {/* Section Category Header */}
            {section.category && (
              <Box
                sx={{
                  px: 1.5,
                  pt: sIndex === 0 ? 0.6 : 1.2,
                  pb: 0.5,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#7DD3FC",
                  }}
                >
                  {section.category}
                </Typography>
              </Box>
            )}

            {/* Section Items List */}
            <List disablePadding>
              {section.items.map((item) => {
                // Collapsible parent (Lead Management)
                if (item.isCollapsible) {
                  const isParentActive = isLeadRoute;

                  return (
                    <Box key={item.title} sx={{ mb: 0.4 }}>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => setLeadMgmtOpen((prev) => !prev)}
                          sx={{
                            minHeight: 38,
                            borderRadius: "8px",
                            px: 1.4,
                            py: 0.55,
                            backgroundColor: isParentActive ? "rgba(0, 91, 172, 0.35)" : "transparent",
                            color: isParentActive ? "#FFFFFF" : "#CBD5E1",
                            borderLeft: isParentActive ? "4px solid #38BDF8" : "4px solid transparent",
                            "&:hover": {
                              backgroundColor: isParentActive ? "#005BAC" : "rgba(255, 255, 255, 0.06)",
                              color: "#FFFFFF",
                            },
                            transition: "all 0.18s ease-in-out",
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 30,
                              color: isParentActive ? "#38BDF8" : "#94A3B8",
                              "& .MuiSvgIcon-root": { fontSize: "1.18rem" },
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
    primary={
      <Typography sx={{ fontSize: "0.825rem", fontWeight: isParentActive ? 700 : 500, whiteSpace: "nowrap" }}>
        {item.title}
      </Typography>
    }
  />
                          {leadMgmtOpen ? (
                            <KeyboardArrowUpRoundedIcon sx={{ fontSize: "1.15rem", color: "#94A3B8" }} />
                          ) : (
                            <KeyboardArrowDownRoundedIcon sx={{ fontSize: "1.15rem", color: "#94A3B8" }} />
                          )}
                        </ListItemButton>
                      </ListItem>

                      {/* Sub-branches */}
                      <Collapse in={leadMgmtOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding sx={{ pl: 1.8, mt: 0.3 }}>
                          {item.subItems.map((sub) => {
                            const isSubActive =
                              sub.path === "/leads/followups"
                                ? location.pathname === "/leads/followups"
                                : sub.path === "/leads" && sub.title !== "+ Add Lead"
                                ? location.pathname === "/leads"
                                : false;

                            return (
                              <ListItem disablePadding key={sub.title} sx={{ mb: 0.3 }}>
                                <ListItemButton
                                  onClick={() => {
                                    if (sub.action === "openAddLead" || sub.title === "+ Add Lead") {
                                      if (location.pathname === "/leads") {
                                        window.dispatchEvent(new CustomEvent("open-create-lead-dialog"));
                                      } else {
                                        navigate("/leads", { state: { openAddLead: Date.now() } });
                                      }
                                      if (mobileOpen && handleDrawerToggle) handleDrawerToggle();
                                      return;
                                    }
                                    navigate(sub.path);
                                    if (mobileOpen && handleDrawerToggle) handleDrawerToggle();
                                  }}
                                  sx={{
                                    minHeight: 34,
                                    borderRadius: "6px",
                                    px: 1.2,
                                    py: 0.45,
                                    backgroundColor: isSubActive ? "#005BAC" : "transparent",
                                    color: isSubActive ? "#FFFFFF" : "#CBD5E1",
                                    borderLeft: isSubActive ? "3px solid #38BDF8" : "3px solid transparent",
                                    boxShadow: isSubActive ? "0 2px 6px rgba(0, 91, 172, 0.3)" : "none",
                                    "&:hover": {
                                      backgroundColor: isSubActive ? "#0A6FD8" : "rgba(255, 255, 255, 0.05)",
                                      color: "#FFFFFF",
                                    },
                                    transition: "all 0.15s ease-in-out",
                                  }}
                                >
                                  <ListItemIcon
                                    sx={{
                                      minWidth: 26,
                                      color: isSubActive ? "#38BDF8" : "#94A3B8",
                                      "& .MuiSvgIcon-root": { fontSize: "1.05rem" },
                                    }}
                                  >
                                    {sub.icon}
                                  </ListItemIcon>
                                  <ListItemText
    primary={
      <Typography sx={{ fontSize: "0.78rem", fontWeight: isSubActive ? 700 : 500, whiteSpace: "nowrap" }}>
        {sub.title}
      </Typography>
    }
  />
                                  {sub.badge && (
                                    <Chip
                                      label={sub.badge}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: "0.62rem",
                                        fontWeight: 800,
                                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                                        color: "#38BDF8",
                                        border: "1px solid rgba(56, 189, 248, 0.3)",
                                        borderRadius: "4px",
                                        px: 0.2,
                                      }}
                                    />
                                  )}
                                </ListItemButton>
                              </ListItem>
                            );
                          })}
                        </List>
                      </Collapse>
                    </Box>
                  );
                }

                // Standard Nav Item
                let displayTitle = item.title;
                if (isBackOfficeStaff) {
                  if (item.path === "/back-office/analytics") displayTitle = "Operations Dashboard";
                  if (item.path === "/back-office") displayTitle = "My Task Queue";
                }
                const isActive = location.pathname === item.path;

                return (
                  <ListItem disablePadding key={item.title} sx={{ mb: 0.4 }}>
                    <ListItemButton
                      onClick={() => {
                        navigate(item.path);
                        if (mobileOpen && handleDrawerToggle) handleDrawerToggle();
                      }}
                      sx={{
                        minHeight: 38,
                        borderRadius: "8px",
                        px: 1.4,
                        py: 0.55,
                        backgroundColor: isActive ? "#005BAC" : "transparent",
                        color: isActive ? "#FFFFFF" : "#CBD5E1",
                        borderLeft: isActive ? "4px solid #38BDF8" : "4px solid transparent",
                        boxShadow: isActive ? "0 2px 8px rgba(0, 91, 172, 0.35)" : "none",
                        "&:hover": {
                          backgroundColor: isActive ? "#0A6FD8" : "rgba(255, 255, 255, 0.06)",
                          color: "#FFFFFF",
                        },
                        transition: "all 0.18s ease-in-out",
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 30,
                          color: isActive ? "#38BDF8" : "#94A3B8",
                          "& .MuiSvgIcon-root": { fontSize: "1.18rem" },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
    primary={
      <Typography sx={{ fontSize: "0.825rem", fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap" }}>
        {displayTitle}
      </Typography>
    }
  />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* 3. BOTTOM FIXED SECTION: User Profile Card & Logout Button */}
      <Box
        sx={{
          p: 1.2,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          flexShrink: 0,
          bgcolor: "#082F52",
        }}
      >
        {/* User Card */}
        <Box
          onClick={() => navigate("/profile")}
          sx={{
            p: 1,
            mb: 0.8,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            cursor: "pointer",
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.09)" },
            transition: "background-color 0.2s ease",
          }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            sx={{
              "& .MuiBadge-badge": {
                backgroundColor: "#22C55E",
                color: "#22C55E",
                boxShadow: "0 0 0 2px #0B3A63",
                width: 8,
                height: 8,
                borderRadius: "50%",
              },
            }}
          >
            <Avatar
              key={user?.id || user?.email || avatarInitials}
              src={avatarSrc || undefined}
              slotProps={{
                img: {
                  onError: (e) => {
                    e.target.style.display = "none";
                  },
                },
              }}
              sx={{
                width: 28,
                height: 28,
                backgroundColor: "#005BAC",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              {avatarInitials}
            </Avatar>
          </Badge>

          <Box sx={{ overflow: "hidden", minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{ fontWeight: 600, fontSize: "0.825rem", color: "#FFFFFF" }}
            >
              {fullName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#38BDF8",
                fontSize: "0.7rem",
                display: "block",
                fontWeight: 500,
              }}
            >
              {roleName}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1, borderColor: "rgba(255, 255, 255, 0.08)" }} />

        {/* Logout Button */}
        <ListItemButton
          onClick={() => setLogoutDialogOpen(true)}
          sx={{
            minHeight: 32,
            borderRadius: "8px",
            color: "#F87171",
            "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.12)" },
            px: 1.5,
            py: 0.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 32,
              color: "#F87171",
              "& .MuiSvgIcon-root": { fontSize: "1.2rem" },
            }}
          >
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            slotProps={{ primary: { fontSize: "0.8rem", fontWeight: 600 } }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Box component="nav" sx={{ width: { md: sidebarWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile Temporary Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: sidebarWidth,
              borderRight: "none",
              overflow: "hidden",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Fixed Permanent Sidebar */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: sidebarWidth,
              borderRight: "none",
              overflow: "hidden",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "12px", p: 1, minWidth: 330 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0B3A63", pb: 1 }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem", color: "#64748B" }}>
            Are you sure you want to end your current session?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ color: "#64748B", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            disableElevation
            sx={{
              backgroundColor: "#EF4444",
              "&:hover": { backgroundColor: "#DC2626" },
              fontWeight: 600,
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;