const buckets = new Map();

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return String(forwarded).split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
};

const rateLimitByIp = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  keyPrefix = "ip",
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${getClientIp(req)}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({ message });
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
};

module.exports = { rateLimitByIp };
