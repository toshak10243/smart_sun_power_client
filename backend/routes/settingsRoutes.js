const express = require("express");

const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { cacheRoute, invalidateCacheMiddleware } = require("../middleware/cacheMiddleware");

const {
  uploadCompanyLogo,
  processCompanyLogo,
} = require("../middleware/uploadMiddleware");

const {
  getSettings,
  updateSettings,
  updateCompanyLogo,
  checkAppUpdate,
} = require("../controllers/settingsController");

// ======================================
// Check App Update (Public for Mobile App Launch)
// ======================================
router.get("/app-update", checkAppUpdate);

// ======================================
// Get Settings (Cached in Redis for 5 minutes)
// ======================================
router.get("/", verifyToken, cacheRoute(300), getSettings);

// ======================================
// Update Settings (Invalidates Settings Cache)
// ======================================
router.put(
  "/",
  verifyToken,
  invalidateCacheMiddleware(["cache:/settings*", "cache:/api/settings*"]),
  updateSettings
);

// ======================================
// Update Company Logo (Invalidates Settings Cache)
// ======================================
router.put(
  "/logo",
  verifyToken,
  uploadCompanyLogo.single("company_logo"),
  processCompanyLogo,
  invalidateCacheMiddleware(["cache:/settings*", "cache:/api/settings*"]),
  updateCompanyLogo
);

module.exports = router;
