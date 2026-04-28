const buckets = new Map();

const getBucketKey = (req, keyPrefix) => {
  const userId = req.user?._id || req.user?.id || req.ip || "anonymous";
  return `${keyPrefix}:${userId}`;
};

const rateLimitByUser = ({
  windowMs = 60 * 1000,
  max = 10,
  keyPrefix = "default",
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = getBucketKey(req, keyPrefix);
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

module.exports = { rateLimitByUser };
