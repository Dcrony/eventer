const bcrypt = require("bcryptjs");
const User = require("../models/User");

/**
 * Create or promote an admin account by email.
 * Used by createadmin.js and optional server startup bootstrap.
 */
async function bootstrapAdmin({
  email,
  password,
  name = "Admin User",
  username = "tickispotadmin",
  phone = "+2348000000000",
}) {
  const normalizedEmail = String(email || "").toLowerCase().trim();
  if (!normalizedEmail) {
    throw new Error("Admin email is required");
  }
  if (!password || String(password).length < 8) {
    throw new Error("Admin password must be at least 8 characters");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    user.role = "admin";
    user.password = hashedPassword;
    user.isVerified = true;
    if (!user.name) user.name = name;
    await user.save();
    return { created: false, email: user.email };
  }

  let resolvedUsername = String(username || "tickispotadmin").trim();
  const usernameTaken = await User.findOne({ username: resolvedUsername });
  if (usernameTaken) {
    resolvedUsername = `admin${Date.now().toString().slice(-6)}`;
  }

  user = await User.create({
    name,
    username: resolvedUsername,
    bio: "Official administrator account for TickiSpot platform",
    email: normalizedEmail,
    phone,
    password: hashedPassword,
    role: "admin",
    location: "TickiSpot Headquarters",
    isVerified: true,
  });

  return { created: true, email: user.email };
}

module.exports = { bootstrapAdmin };
