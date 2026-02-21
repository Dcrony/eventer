const jwt = require("jsonwebtoken");
const User = require("../models/User"); // 👈 import User model
const JWT_SECRET = process.env.JWT_SECRET;

exports.authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1]?.trim();

  // Validate token format (JWT should have 3 parts separated by dots)
  if (!token || token === "undefined" || token === "null" || token.split(".").length !== 3) {
    console.error("Malformed token received:", token ? `${token.substring(0, 20)}...` : "empty");
    return res.status(401).json({ message: "Invalid token format" });
  }

  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user from DB to attach full details
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // 👈 now includes id, role, name, email, etc.
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
