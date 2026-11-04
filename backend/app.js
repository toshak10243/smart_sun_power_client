const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// ======================================
// Middlewares
// ======================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for rate limiting behind reverse proxies (Nginx/Cloudflare)
app.set("trust proxy", 1);

// ======================================
// Static Uploads
// ======================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================================
// Rate Limiting Middlewares (Redis-backed)
// ======================================

const { apiLimiter, authLimiter } = require("./middleware/rateLimiter");

// Apply general limiter to all /api endpoints
app.use("/api", apiLimiter);

// ======================================
// Routes Imports
// ======================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const leadRoutes = require("./routes/leadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const projectFileRoutes = require("./routes/projectFileRoutes");

// ======================================
// API Routes
// ======================================

// Stricter rate limiter for auth (brute force protection)
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/files", projectFileRoutes);

// ======================================
// Base Route
// ======================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Solar CRM API Running with Redis Cache, Bull Queues & Rate Limiting 🚀",
  });
});

// ======================================

module.exports = app;
