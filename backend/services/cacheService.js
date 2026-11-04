const { redisClient, isRedisReady } = require("../config/redis");

// In-memory fallback map if Redis is temporarily down
const memoryCache = new Map();

const CacheService = {
  /**
   * Get cached data by key
   */
  async get(key) {
    try {
      if (isRedisReady()) {
        const val = await redisClient.get(key);
        if (val) {
          return JSON.parse(val);
        }
        return null;
      }
    } catch (err) {
      console.warn(`[CacheService get error] for ${key}:`, err.message);
    }

    // Fallback to memory cache
    const mem = memoryCache.get(key);
    if (mem && mem.expiry > Date.now()) {
      return mem.data;
    }
    return null;
  },

  /**
   * Set cached data with TTL in seconds (default 5 minutes)
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      const serialized = JSON.stringify(value);
      if (isRedisReady()) {
        await redisClient.set(key, serialized, "EX", ttlSeconds);
        return true;
      }
    } catch (err) {
      console.warn(`[CacheService set error] for ${key}:`, err.message);
    }

    // Fallback to memory cache
    memoryCache.set(key, {
      data: value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
    return true;
  },

  /**
   * Delete a specific key
   */
  async del(key) {
    try {
      if (isRedisReady()) {
        await redisClient.del(key);
      }
    } catch (err) {
      console.warn(`[CacheService del error] for ${key}:`, err.message);
    }
    memoryCache.delete(key);
    return true;
  },

  /**
   * Delete keys matching a wildcard pattern (e.g. 'dashboard:*', 'leads:*')
   */
  async delPattern(pattern) {
    try {
      if (isRedisReady()) {
        const keys = await redisClient.keys(pattern);
        if (keys && keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (err) {
      console.warn(`[CacheService delPattern error] for ${pattern}:`, err.message);
    }

    // Clean up memory cache too
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const k of memoryCache.keys()) {
      if (regex.test(k)) {
        memoryCache.delete(k);
      }
    }
    return true;
  },

  /**
   * Cache-aside wrapper: returns cached value or executes fn and caches result
   */
  async wrap(key, ttlSeconds, fetchFunction) {
    const cached = await this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
    const freshData = await fetchFunction();
    if (freshData !== null && freshData !== undefined) {
      await this.set(key, freshData, ttlSeconds);
    }
    return freshData;
  },
};

module.exports = CacheService;

