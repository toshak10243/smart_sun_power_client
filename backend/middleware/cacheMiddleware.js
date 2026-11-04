const CacheService = require("../services/cacheService");

/**
 * Cache route middleware for GET endpoints
 * @param {number} ttlSeconds - Time-to-live in seconds (default 120s / 2min)
 * @param {boolean} userSpecific - Whether cache should be partitioned per logged-in user
 */
const cacheRoute = (ttlSeconds = 120, userSpecific = false) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const userId = (userSpecific && req.user && req.user.id) ? `:u${req.user.id}` : "";
    const cacheKey = `cache:${req.baseUrl || ""}${req.path}${userId}:${JSON.stringify(req.query)}`;

    try {
      const cachedResponse = await CacheService.get(cacheKey);
      if (cachedResponse) {
        res.setHeader("X-Cache", "HIT");
        return res.status(200).json(cachedResponse);
      }

      // Intercept res.json to cache the response before sending
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Only cache successful 200 responses
        if (res.statusCode === 200 && body && body.success !== false) {
          CacheService.set(cacheKey, body, ttlSeconds).catch(() => {});
        }
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };

      next();
    } catch (err) {
      // If cache fails, silently proceed with regular request
      next();
    }
  };
};

/**
 * Clear cache patterns after state mutations
 * @param {string[]} patterns
 */
const invalidateCacheMiddleware = (patterns = []) => {
  return async (req, res, next) => {
    // Execute cache invalidation after response finishes
    res.on("finish", async () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        for (const pattern of patterns) {
          await CacheService.delPattern(pattern);
        }
      }
    });
    next();
  };
};

module.exports = {
  cacheRoute,
  invalidateCacheMiddleware,
};

