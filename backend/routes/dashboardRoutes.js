const express = require("express");
const router = express.Router();

const {
  getManagerDashboardStats,
  getSalesDashboardStats,
  getAdminDashboardStats,
} = require("../controllers/dashboardController");
const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { cacheRoute } = require("../middleware/cacheMiddleware");

const ROLE_SUPER_ADMIN = 1;
const ROLE_SALES = 3;

// Manager Dashboard Endpoint (ROLE_MANAGER = 2) - Cached per user for 60s
router.get(
  "/manager",
  verifyToken,
  authorizeRoles(2), // Role ID 2 = Manager
  cacheRoute(60, true),
  getManagerDashboardStats
);

// Sales Rep Dashboard Endpoint (ROLE_SALES = 3) - Cached per user for 60s
router.get(
  "/sales",
  verifyToken,
  authorizeRoles(ROLE_SALES),
  cacheRoute(60, true),
  getSalesDashboardStats
);

// Admin Dashboard Endpoint (ROLE_SUPER_ADMIN = 1) - Cached for 60s
router.get(
  "/admin",
  verifyToken,
  authorizeRoles(ROLE_SUPER_ADMIN),
  cacheRoute(60, true),
  getAdminDashboardStats
);

module.exports = router;
