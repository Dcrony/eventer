/**
 * One-time admin bootstrap. Run from server/: node createadmin.js
 *
 * Required env:
 *   MONGO_URI (or MONGODB_URI)
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD (min 8 characters)
 * Optional: ADMIN_NAME, ADMIN_USERNAME
 */
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "tickispotadmin";

if (!MONGO_URI) {
  console.error("Missing MONGO_URI or MONGODB_URI in environment.");
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this script.");
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

mongoose.connect(MONGO_URI).then(run).catch((err) => {
  console.error(err);
  process.exit(1);
});

async function run() {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists:", existingAdmin.email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await User.create({
      name: ADMIN_NAME,
      username: ADMIN_USERNAME,
      bio: "Official administrator account for TickiSpot platform",
      email: ADMIN_EMAIL.toLowerCase().trim(),
      phone: process.env.ADMIN_PHONE || "+2348000000000",
      password: hashedPassword,
      role: "admin",
      location: "TickiSpot Headquarters",
      isVerified: true,
    });

    console.log("Admin created:", admin.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
