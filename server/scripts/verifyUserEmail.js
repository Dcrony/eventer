/**
 * One-off: mark a user email as verified (local/dev support).
 * Usage: node scripts/verifyUserEmail.js <email>
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/verifyUserEmail.js <email>");
  process.exit(1);
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const r = await User.findOneAndUpdate(
    { email },
    {
      $set: { isVerified: true },
      $unset: { verificationCode: 1, verificationCodeExpires: 1, emailVerificationToken: 1 },
    },
    { new: true }
  );
  if (!r) {
    console.log("NOT_FOUND: no user with email", email);
  } else {
    console.log("OK:", r.email, "isVerified=", r.isVerified);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
