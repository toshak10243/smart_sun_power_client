import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
} from "@mui/material";

// Material UI Icons
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PhoneInTalkOutlinedIcon from "@mui/icons-material/PhoneInTalkOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

// Logo
import logo from "../assets/images/logo.png";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "https://smartsunpower.tech";

// Synced categorized navigation matching exact Sales requirements
const navigationSections = [
  {
    category: "MAIN",
    items: [
      { title: "Dashboard", icon: <DashboardOutlinedIcon />, path: "/sales/dashboard" },
    ],
  },
  {
    category: "WORKSPACE",
    items: [
      { title: "My Leads", icon: <PhoneInTalkOutlinedIcon />, path: "/sales/leads" },
      { title: "My Won Orders", icon: <ReceiptLongOutlinedIcon />, path: "/sales/won-orders" },
    ],
  },
  {
    category: "ACCOUNT",
    items: [
      { title: "My Profile", icon: <PersonOutlineOutlinedIcon />, path: "/sales/profile" },
    ],
  },
];

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "S";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const SalesSidebar = ({ mobileOpen, handleDrawerToggle, sidebarWidth = 240 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const fullName = user?.full_name || user?.name || "Sales Executive";
  const roleName = user?.role_name || user?.role || "Salesperson";
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

  const handleConfirmLogout = () => {
    if (authLogout) {
      authLogout();
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }
    setLogoutDialogOpen(false);
    navigate("/", { replace: true });
  };

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
      {/* 1. BRAND HEADER: Exact 72px */}
      <Box
        sx={{
          height: 72,
          minHeight: 72,
          boxSizing: "border-box",
          px: 2.2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="Solar CRM"
          sx={{ height: 36, width: "auto", flexShrink: 0 }}
        />
        <Box sx={{ overflow: "hidden", minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 800,
              lineHeight: 1.2,
              color: "#FFFFFF",
              fontSize: "0.98rem",
              letterSpacing: "0.02em",
            }}
          >
            Solar CRM
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.2, overflow: "hidden" }}>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "#F1F5F9",
                fontSize: "0.75rem",
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {fullName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#64748B",
                fontSize: "0.7rem",
                lineHeight: 1,
              }}
            >
              •
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{
                color: "#38BDF8",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              {roleName || "Sales"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. NAVIGATION SECTIONS */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          py: 1,
          px: 1.2,
          overflowY: "auto",
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
        {navigationSections.map((section, sIndex) => (
          <Box key={section.category || sIndex} sx={{ mb: 1.2 }}>
            {/* Section Category Header */}
            {section.category && (
              <Box
                sx={{
                  px: 1.4,
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
                        primary={item.title}
                        primaryTypographyProps={{
                          fontSize: "0.825rem",
                          fontWeight: isActive ? 700 : 500,
                          whiteSpace: "nowrap",
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* 3. FOOTER: PROFILE & LOGOUT */}
      <Box sx={{ p: 1.2, borderTop: "1px solid rgba(255, 255, 255, 0.08)", flexShrink: 0, bgcolor: "#082F52" }}>
        <Box
          onClick={() => navigate("/sales/profile")}
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
              key={user?.id || avatarInitials}
              src={avatarSrc || undefined}
              imgProps={{
                onError: (e) => {
                  e.target.style.display = "none";
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
              sx={{ color: "#38BDF8", fontSize: "0.7rem", display: "block", fontWeight: 500 }}
            >
              {roleName}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1, borderColor: "rgba(255, 255, 255, 0.08)" }} />

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
          <ListItemIcon sx={{ minWidth: 32, color: "#F87171", "& .MuiSvgIcon-root": { fontSize: "1.2rem" } }}>
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: "0.8rem", fontWeight: 600 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      <Box component="nav" sx={{ width: { md: sidebarWidth }, flexShrink: { md: 0 } }}>
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

      {/* CONFIRM LOGOUT DIALOG */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "12px", p: 1, minWidth: 330 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#0B3A63", pb: 1, fontSize: "0.98rem" }}>
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem", color: "#64748B" }}>
            Are you sure you want to end your current Sales session?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ color: "#64748B", fontWeight: 600, fontSize: "0.85rem" }}
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
              fontSize: "0.85rem",
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalesSidebar;