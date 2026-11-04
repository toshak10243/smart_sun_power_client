const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { redisClient, isRedisReady } = require("../config/redis");

// Factory for Redis or Memory store
const getStore = (prefix) => {
  try {
    if (isRedisReady()) {
      return new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
        prefix: `rl:${prefix}:`,
      });
    }
  } catch (e) {
    console.warn(`[RateLimit Warn] Could not initialize RedisStore for ${prefix}, using in-memory store`);
  }
  return undefined; // default in-memory store
};

/**
 * 1. Global API Rate Limiter
 * 500 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("api"),
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

/**
 * 2. Auth Limiter (Login, Forgot Password, OTP verification)
 * 20 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("auth"),
  message: {
    success: false,
    message: "Too many login attempts. For security reasons, please try again in 15 minutes.",
  },
});

/**
 * 3. File Upload Limiter
 * 60 uploads per 10 minutes per IP
 */
const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("upload"),
  message: {
    success: false,
    message: "Upload rate limit reached. Please wait a few moments before uploading more files.",
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
};

