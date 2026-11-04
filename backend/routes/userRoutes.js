const express = require("express");
const router = express.Router();

const {
    createUser,
    getUsers,
    getUserById,
    getTeamMembers,
    updateUser,
    updateUserStatus,
    deleteUser,
    updateFcmToken,
    getManagerAssignmentsSummary,
    getManagerAssignedLeads,
    getUserStatsController
} = require("../controllers/userController");

const { verifyToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// 🟢 Update FCM Token (Logged-in user ke liye — Admin/Manager/Sales sabhi)
// NOTE: Isko /:id se upar rakha hai taaki route clash na ho
router.put(
    "/fcm-token",
    verifyToken,
    updateFcmToken
);

// 🟢 Manager Assignments (Super Admin: ROLE_SUPER_ADMIN = 1)
// NOTE: Isko /:id se upar rakhna zaroori hai taaki route clash na ho

// 🟢 User KPI Stats (Super Admin & Manager)
router.get(
    "/stats",
    verifyToken,
    authorizeRoles(1, 2),
    getUserStatsController
);

router.get(
    "/manager-assignments",
    verifyToken,
    authorizeRoles(1),
    getManagerAssignmentsSummary
);

router.get(
    "/manager-assignments/:id/leads",
    verifyToken,
    authorizeRoles(1),
    getManagerAssignedLeads
);

// Create User
router.post(
    "/",
    verifyToken,
    authorizeRoles(1),
    createUser
);

// Get All Users
router.get(
    "/",
    verifyToken,
    authorizeRoles(1),
    getUsers
);

// 🔵 Get Manager's Team Members (ROLE_MANAGER = 2)
router.get(
    "/team",
    verifyToken,
    authorizeRoles(2),
    getTeamMembers
);

// Get User By ID
router.get(
    "/:id",
    verifyToken,
    authorizeRoles(1),
    getUserById
);

// Update User
router.put(
    "/:id",
    verifyToken,
    authorizeRoles(1),
    updateUser
);

// Change User Status (Active/Inactive)
router.patch(
    "/status/:id",
    verifyToken,
    authorizeRoles(1),
    updateUserStatus
);

// Soft Delete User
router.delete(
    "/:id",
    verifyToken,
    authorizeRoles(1),
    deleteUser
);

module.exports = router;