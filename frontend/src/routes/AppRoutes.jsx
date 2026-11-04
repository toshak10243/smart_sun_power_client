import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Auth Pages
import Login from "../pages/Auth/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";

// Route Guard
import PrivateRoute from "./PrivateRoute";

// Layouts
import AdminLayout from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";
import SalesLayout from "../layouts/SalesLayout";

// Admin Pages
import Dashboard from "../pages/Dashboard/Dashboard";
import Users from "../pages/Users/Users";
import ManagerAssignments from "../pages/Admin/ManagerAssignments";
import Leads from "../pages/Leads/Leads";
import TodaysFollowup from "../pages/Leads/TodaysFollowup";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";
import Profile from "../pages/Profile/Profile";
import BackOfficeDashboard from "../pages/BackOffice/BackOfficeDashboard";
import DocumentRepository from "../pages/BackOffice/DocumentRepository";
import OperationsAnalyticsDashboard from "../pages/BackOffice/OperationsAnalyticsDashboard";

// Manager Pages
import ManagerDashboard from "../pages/Manager/ManagerDashboard";
import TeamMembers from "../pages/Manager/TeamMembers";
import ManagerLeads from "../pages/Manager/ManagerLeads";
import ManagerProfile from "../pages/Manager/ManagerProfile";
import TeamFollowups from "../pages/Manager/TeamFollowups";
import ManagerReports from "../pages/Manager/ManagerReports";
import ManagerWonTracker from "../pages/Manager/ManagerWonTracker";

// Sales Pages
import SalesDashboard from "../pages/Sales/SalesDashboard";
import SalesLeads from "../pages/Sales/SalesLeads";
import SalesWonOrders from "../pages/Sales/SalesWonOrders";
import SalesProfile from "../pages/Sales/SalesProfile"; // 🟢 Connected Sales Profile Page

// Safe Root Handler
const HomeOrLogin = () => {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (token && user) {
      const role = (user?.role_name || user?.role || "").toLowerCase();
      if (role.includes("manager")) {
        navigate("/manager/dashboard", { replace: true });
      } else if (role.includes("sales")) {
        navigate("/sales/dashboard", { replace: true });
      } else if (
        role.includes("back office") ||
        role.includes("loan") ||
        role.includes("accounts") ||
        role.includes("installation") ||
        role.includes("portal")
      ) {
        navigate("/back-office/analytics", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [token, user, loading, navigate]);

  if (loading) return null;

  // Unauthenticated -> Show Login Component directly
  if (!token || !user) {
    return <Login />;
  }

  return null;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROOT */}
        <Route path="/" element={<HomeOrLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 🔴 ADMIN & BACK OFFICE BOUNDARY */}
        <Route
          element={
            <PrivateRoute
              allowedRoles={[
                "Admin",
                "Super Admin",
                "Back Office Online",
                "Back Office Field",
                "Loan Officer",
                "Accounts",
                "Installation Lead",
                "Portal Entry",
              ]}
            />
          }
        >
          <Route element={<AdminLayout />}>
            <Route path="/back-office/analytics" element={<OperationsAnalyticsDashboard />} />
            <Route path="/back-office" element={<BackOfficeDashboard />} />
            <Route path="/documents" element={<DocumentRepository />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/manager-assignments" element={<ManagerAssignments />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/followups" element={<TodaysFollowup />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* 🔵 MANAGER BOUNDARY */}
        <Route element={<PrivateRoute allowedRoles={["Manager", "Team Manager"]} />}>
          <Route element={<ManagerLayout />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/team" element={<TeamMembers />} />
            <Route path="/manager/leads" element={<ManagerLeads />} />
            <Route path="/manager/won-tracker" element={<ManagerWonTracker />} />
            <Route path="/manager/followups" element={<TeamFollowups />} />
            <Route path="/manager/reports" element={<ManagerReports />} />
            <Route path="/manager/profile" element={<ManagerProfile />} />
          </Route>
        </Route>

        {/* 🟢 SALES EXECUTIVE BOUNDARY */}
        <Route element={<PrivateRoute allowedRoles={["Sales Executive", "Salesperson", "Sales"]} />}>
          <Route element={<SalesLayout />}>
            <Route path="/sales/dashboard" element={<SalesDashboard />} />
            <Route path="/sales/leads" element={<SalesLeads />} />
            <Route path="/sales/won-orders" element={<SalesWonOrders />} />
            <Route path="/sales/profile" element={<SalesProfile />} />
          </Route>
        </Route>

        {/* SAFE CATCH-ALL */}
        <Route path="*" element={<HomeOrLogin />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;