const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const { validateLoginBody, validateRegisterBody, validateEmailOnly } = require("../utils/authValidation");
const { verifyIdToken } = require("../utils/firebaseAdmin");
const { otpEmail } = require("../utils/emailTemplates");
const { welcomeSuccessEmail } = require("../utils/emailTemplates");
const {
  assignTrialToUser,
  ensureSubscriptionState,
  getTrialDaysRemaining,
  isTrialActive,
} = require("../services/subscriptionService");

const JWT_SECRET = process.env.JWT_SECRET;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const signAuthToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAdmin: user.role === "admin",
      isOrganizer: user.role === "organizer",
      sv: Number(user.security?.sessionVersion || 0),
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

const buildAuthUserPayload = (user) => {
  if (!user) return null;
  const id = user._id || user.id;
  return {
    _id: id,
    id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    isAdmin: user.role === "admin",
    isOrganizer: user.role === "organizer",
    profilePic: user.profilePic,
    plan: user.plan || "free",
    trialEndsAt: user.trialEndsAt || null,
    subscriptionStatus: user.subscriptionStatus || "inactive",
    hasProAccess: user.plan === "pro" || isTrialActive(user),
    trialDaysRemaining: getTrialDaysRemaining(user),
    eventCount: typeof user.eventCount === "number" ? user.eventCount : 0,
    isVerified: user.isVerified,
  };
};

/**
 * Only expose OTP in non-production when email could not be sent (local dev).
 */
function verificationCodeResponseField(emailSent, otp) {
  if (emailSent || process.env.NODE_ENV === "production") {
    return {};
  }
  return { verificationCode: otp };
}

/**
 * Generates a unique username derived from a display name, appending random
 * suffixes until no collision is found in the DB.
 */
async function ensureUniqueUsername(base) {
  const clean =
    String(base || "user")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 24) || "user";
  let username = clean;
  let suffix = 0;
  while (await User.findOne({ username })) {
    suffix += 1;
    username = `${clean.slice(0, 18)}${suffix.toString(36)}${Math.random()
      .toString(36)
      .slice(2, 5)}`;
  }
  return username;
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER  — email/password, OTP flow (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  try {
    const validation = validateRegisterBody(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }
    const { fullName, username, email, phone, password } = validation;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const newUser = new User({
      name: fullName,
      username,
      email,
      phone,
      password: hashedPassword,
      role: "organizer",
      isVerified: false,
      verificationCode: hashedOtp,
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Grant free trial on email registration
    assignTrialToUser(newUser);
    await newUser.save();

    const emailResult = await sendEmail({
      to: email,
      subject: "Your TickiSpot verification code",
      html: otpEmail(otp),
    });

    const emailSent = Boolean(emailResult.success);

    res.status(201).json({
      message: emailSent
        ? "Account created. Check your email for your verification code."
        : "Account created. Copy your verification code below, then enter it to verify.",
      email,
      ...verificationCodeResponseField(emailSent, otp),
    });
  } catch (error) {
    console.error("❌ REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN  — email/password (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  const validation = validateLoginBody(req.body);
  if (!validation.ok) {
    return res.status(400).json({ message: validation.message });
  }
  const { email, password } = validation;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    await ensureSubscriptionState(user);

    if (!user.password) {
      return res.status(403).json({
        message: "This account uses Google sign-in. Please use Sign in with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

      user.verificationCode = hashedOtp;
      user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const emailResult = await sendEmail({
        to: user.email,
        subject: "Your Verification Code - TickiSpot",
        html: otpEmail(otp),
      });

      const emailSent = Boolean(emailResult.success);

      return res.status(403).json({
        message: emailSent
          ? "Account not verified. A verification code was sent to your email."
          : "Account not verified. Copy your verification code below, then verify on the next screen.",
        code: "OTP_SENT",
        email: user.email,
        ...verificationCodeResponseField(emailSent, otp),
      });
    }

    await ensureSubscriptionState(user);
    const token = signAuthToken(user);

    res.status(200).json({
      message: "Login successful ✅",
      token,
      user: buildAuthUserPayload(user),
    });
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL  — token-based (legacy, unchanged)
// ─────────────────────────────────────────────────────────────────────────────

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error("❌ VERIFY EMAIL ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

exports.forgotPassword = async (req, res) => {
  try {
    const validated = validateEmailOnly(req.body?.email);
    if (!validated.ok) {
      return res.status(400).json({ message: validated.message });
    }
    const { email } = validated;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Reset Your Password - TickiSpot",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({ message: "Password reset email sent!" });
  } catch (error) {
    console.error("❌ FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const password = String(newPassword).replace(/[\x00-\x1F\x7F]/g, "");
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error("❌ RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE LOGIN  — legacy direct login endpoint (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

exports.firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "No token provided" });

    const decodedToken = await verifyIdToken(idToken);
    const { email, name, uid } = decodedToken;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = new User({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        username: email.split("@")[0] + Math.floor(Math.random() * 1000),
        firebaseUid: uid,
        isVerified: true,
        role: "organizer",
      });
      assignTrialToUser(user);
      await user.save();
    } else {
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    await ensureSubscriptionState(user);
    const token = signAuthToken(user);

    res.status(200).json({
      token,
      user: buildAuthUserPayload(user),
    });
  } catch (error) {
    console.error("Firebase Login Error:", error);
    res.status(401).json({ message: "Invalid Firebase token" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE SYNC  — main Google sign-in/sign-up handler
//
// KEY CHANGES:
//   • New Google users  → isVerified: true, assignTrialToUser(), welcome email,
//                         return JWT immediately (NO OTP step).
//   • Returning Google users who are still unverified (edge-case: created via
//     an older code path) → auto-verify + assign trial if missing, return JWT.
//   • Already-verified users → behaviour unchanged, return JWT.
// ─────────────────────────────────────────────────────────────────────────────

exports.firebaseSync = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    // 1. Verify the Firebase ID token with Firebase Admin SDK
    const decoded = await verifyIdToken(idToken);
    const {
      email: firebaseEmail,
      name: firebaseName,
      uid: firebaseUid,
    } = decoded;

    if (!firebaseEmail) {
      return res.status(400).json({ message: "Email not found in Firebase token" });
    }

    const emailLower = firebaseEmail.toLowerCase();

    // 2. Look up existing user by Firebase UID or email
    let user = await User.findOne({
      $or: [{ firebaseUid }, { email: emailLower }],
    });

    // ── CASE A: brand-new user ──────────────────────────────────────────────
    if (!user) {
      const displayName = firebaseName || firebaseEmail.split("@")[0];
      const username = await ensureUniqueUsername(displayName);

      user = new User({
        name: displayName,
        username,
        email: emailLower,
        firebaseUid,
        role: "organizer",
        // Google already verified the email address — no OTP needed.
        isVerified: true,
        verificationCode: undefined,
        verificationCodeExpires: undefined,
      });

      // Grant free trial (same as email registration)
      assignTrialToUser(user);
      await user.save();

      // Send welcome email (non-blocking — do not await)
      sendEmail({
        to: emailLower,
        subject: "🎉 Welcome to TickiSpot!",
        html: welcomeSuccessEmail(user.name),
      }).catch((err) => console.error("Welcome email failed:", err));

      await ensureSubscriptionState(user);
      const token = signAuthToken(user);

      return res.status(201).json({
        message: "Account created successfully. Welcome to TickiSpot!",
        token,
        user: buildAuthUserPayload(user),
      });
    }

    // ── CASE B: user exists but is not yet verified (legacy / edge-case) ───
    // Could happen if the user was created through an older code path that
    // left isVerified: false.  Since they are authenticating via Google we
    // can trust the email and verify them automatically.
    if (!user.isVerified) {
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;

      // Link Firebase UID if it wasn't stored before
      if (!user.firebaseUid) user.firebaseUid = firebaseUid;

      // Grant trial if they never received one
      if (!user.trialEndsAt) assignTrialToUser(user);

      await user.save();

      // Send welcome email (non-blocking)
      sendEmail({
        to: user.email,
        subject: "🎉 Welcome to TickiSpot!",
        html: welcomeSuccessEmail(user.name),
      }).catch((err) => console.error("Welcome email failed:", err));

      await ensureSubscriptionState(user);
      const token = signAuthToken(user);

      return res.status(200).json({
        message: "Account verified. Welcome to TickiSpot!",
        token,
        user: buildAuthUserPayload(user),
      });
    }

    // ── CASE C: existing verified user — normal login ───────────────────────
    // Link Firebase UID if missing (e.g. user registered via email earlier)
    if (!user.firebaseUid) {
      user.firebaseUid = firebaseUid;
      await user.save();
    }

    await ensureSubscriptionState(user);
    const token = signAuthToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: buildAuthUserPayload(user),
    });
  } catch (error) {
    console.error("❌ FIREBASE SYNC ERROR:", error);
    if (error?.code === "FIREBASE_ADMIN_NOT_CONFIGURED") {
      return res.status(503).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error during Firebase sync" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL OTP  — verifies 6-digit code for email/password registrations
// ─────────────────────────────────────────────────────────────────────────────

exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be exactly 6 digits" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res
        .status(400)
        .json({ message: "No verification code found. Please request a new one." });
    }

    if (new Date() > user.verificationCodeExpires) {
      return res.status(400).json({
        message: "Verification code expired. Please request a new one.",
        code: "OTP_EXPIRED",
      });
    }

    const hashedInputOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (hashedInputOtp !== user.verificationCode) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ OTP valid — mark user as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Send welcome email (non-blocking)
    sendEmail({
      to: user.email,
      subject: "🎉 Welcome to TickiSpot!",
      html: welcomeSuccessEmail(user.name),
    }).catch((err) => console.error("Welcome email failed:", err));

    const token = signAuthToken(user);

    res.status(200).json({
      message: "Email verified successfully! ✅",
      token,
      user: buildAuthUserPayload(user),
    });
  } catch (error) {
    console.error("❌ VERIFY EMAIL OTP ERROR:", error);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESEND OTP  — only valid for email/password accounts
// ─────────────────────────────────────────────────────────────────────────────

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.verificationCode = hashedOtp;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Your New Verification Code - TickiSpot",
      html: otpEmail(otp),
    });

    const emailSent = Boolean(emailResult.success);

    res.status(200).json({
      message: emailSent
        ? "New verification code sent to your email."
        : "Copy your new verification code below.",
      ...verificationCodeResponseField(emailSent, otp),
    });
  } catch (error) {
    console.error("❌ RESEND OTP ERROR:", error);
    res.status(500).json({ message: "Server error resending OTP" });
  }
};