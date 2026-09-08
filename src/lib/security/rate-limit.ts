interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limiting store (key -> entry)
const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

/**
 * Check if an action by an IP / key exceeds rate limit.
 * Returns true if allowed, false if limit exceeded.
 */
export function checkRateLimit(key: string, options: RateLimitOptions = { limit: 5, windowMs: 15 * 60 * 1000 }): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    store.set(key, newEntry);
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: options.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

export const RATE_LIMITS = {
  LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 },
  PASSWORD_RESET: { limit: 5, windowMs: 15 * 60 * 1000 },
};
