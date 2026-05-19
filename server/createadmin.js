/**
 * One-time admin bootstrap. Run from server/: node createadmin.js
 *
 * Required env:
 *   MONGO_URI (or MONGODB_URI)
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD (min 8 characters)
 * Optional: ADMIN_NAME, ADMIN_USERNAME, ADMIN_PHONE
 */
require("dotenv").config();

const mongoose = require("mongoose");
const { bootstrapAdmin } = require("./utils/bootstrapAdmin");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin User";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "tickispotadmin";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "+2348000000000";

if (!MONGO_URI) {
  console.error("Missing MONGO_URI or MONGODB_URI in environment.");
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running this script.");
  process.exit(1);
}

mongoose.connect(MONGO_URI).then(run).catch((err) => {
  console.error(err);
  process.exit(1);
});

async function run() {
  try {
    const result = await bootstrapAdmin({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      username: ADMIN_USERNAME,
      phone: ADMIN_PHONE,
    });

    if (result.created) {
      console.log("Admin created:", result.email);
    } else {
      console.log("Existing user promoted to admin:", result.email);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
