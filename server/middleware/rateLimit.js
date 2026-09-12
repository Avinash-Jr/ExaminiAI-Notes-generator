/**
 * Dependency-free, in-memory rate limiter (fixed-window per client).
 *
 * Good enough for a single instance. If you scale to multiple instances or
 * dynos, move this to a shared store (Redis) so the window is shared — an
 * in-memory window only counts requests that hit THIS process.
 *
 * Keyed by authenticated user id when present, otherwise client IP. Behind a
 * proxy (Render/Railway/Vercel) make sure `app.set("trust proxy", 1)` is on so
 * req.ip is the real client, not the proxy — index.js already does this in prod.
 */

const buckets = new Map(); // key -> { count, resetAt }

// Evict expired buckets so the map can't grow without bound. unref() lets the
// process exit even while this timer is pending.
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
if (typeof sweeper.unref === "function") sweeper.unref();

/**
 * @param {object} opts
 * @param {number} opts.windowMs  Window length in ms (default 60s)
 * @param {number} opts.max       Max requests per window (default 100)
 * @param {string} opts.name      Bucket namespace so different routes don't share counts
 */
export function rateLimit({ windowMs = 60_000, max = 100, name = "default" } = {}) {
  return (req, res, next) => {
    const identity =
      req.userId ||
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket?.remoteAddress ||
      "unknown";
    const key = `${name}:${identity}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));

    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "Too many requests. Please slow down and try again shortly.",
      });
    }
    next();
  };
}
