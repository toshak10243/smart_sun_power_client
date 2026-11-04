const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  checkDuplicateLead,
  createLead, getLeads, getLeadById, getTeamFollowupsList,
  getFollowupDirectory, updateLead, updateLeadStatus,
  assignLead, bulkReassign, bulkImport, addFollowup, getFollowups, getActivityLogs, deleteLead,
  getLeadStatusLogs, getClosedLeadsReport,
} = require("../controllers/leadController");

const ROLE_SUPER_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_SALES = 3;

router.get("/", verifyToken, getLeads);
router.get("/check-duplicate", verifyToken, checkDuplicateLead);
router.post("/", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER, ROLE_SALES), createLead);

// ⚠️ /:id se UPAR rakhna zaroori hai, warna "bulk-reassign" ko :id samajh lega
router.patch("/bulk-reassign", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), bulkReassign);

// ⚠️ /:id se UPAR rakhna hai
router.post("/bulk-import", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), bulkImport);

// ⚠️ /:id se UPAR rakhna hai
router.get("/followups/directory", verifyToken, getFollowupDirectory);

router.get("/team/followups", verifyToken, authorizeRoles(ROLE_MANAGER), getTeamFollowupsList);

// 📊 Reports — Closed Leads (Not Interested & Lost)
router.get("/reports/closed-leads", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), getClosedLeadsReport);

router.get("/:id", verifyToken, getLeadById);
router.put("/:id", verifyToken, updateLead);
router.patch("/:id/status", verifyToken, updateLeadStatus);
router.post("/:id/assign", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN, ROLE_MANAGER), assignLead);
router.post("/:id/followups", verifyToken, addFollowup);
router.get("/:id/followups", verifyToken, getFollowups);
router.get("/:id/logs", verifyToken, getActivityLogs);
router.get("/:id/status-logs", verifyToken, getLeadStatusLogs);
router.delete("/:id", verifyToken, authorizeRoles(ROLE_SUPER_ADMIN), deleteLead);

module.exports = router;