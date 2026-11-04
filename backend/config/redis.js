const Redis = require("ioredis");

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

let isReady = false;

// Create ioredis instance with retry strategy and null maxRetriesPerRequest for BullMQ
const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy(times) {
    if (times > 5) {
      // Slow down retries after 5 attempts
      return 10000;
    }
    return Math.min(times * 1000, 3000);
  },
});

redisClient.on("connect", () => {
  console.log(`[Redis] Connecting to ${redisHost}:${redisPort}...`);
});

redisClient.on("ready", () => {
  isReady = true;
  console.log("[Redis] Connected and ready to serve requests! 🚀");
});

redisClient.on("error", (err) => {
  isReady = false;
  // Non-fatal logging so backend never crashes if Redis is restarting
  console.warn(`[Redis Warn] ${err.message || "Redis connection issue"}`);
});

redisClient.on("close", () => {
  isReady = false;
  console.log("[Redis] Connection closed.");
});

// Try initial connection in background
redisClient.connect().catch((err) => {
  console.warn("[Redis Warn] Initial connection failed:", err.message);
});

module.exports = {
  redisClient,
  isRedisReady: () => isReady,
  redisConfig: {
    host: redisHost,
    port: redisPort,
    password: redisPassword,
  },
};

