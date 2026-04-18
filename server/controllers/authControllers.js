const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const { validateLoginBody, validateRegisterBody } = require("../utils/authValidation");
const { verifyIdToken } = require("../utils/firebaseAdmin");
const { otpEmail } = require("../utils/emailTemplates");

const JWT_SECRET = process.env.JWT_SECRET;

/** When transactional email is not configured or fails, expose the OTP in the JSON so the app can show it. */
function verificationCodeResponseField(emailSent, otp) {
  return emailSent ? {} : { verificationCode: otp };
}

// 🟢 REGISTER CONTROLLER — OTP only (no magic link)
exports.register = async (req, res) => {
  try {
    const validation = validateRegisterBody(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }
    const { fullName, username, email, phone, password } = validation;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already in use" });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    const role = "user";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Create new user (verified after OTP)
    const newUser = new User({
      name: fullName,
      username,
      email,
      phone,
      password: hashedPassword,
      role,
      isVerified: false,
      verificationCode: hashedOtp,
      verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
    });

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

// LOGIN CONTROLLER
exports.login = async (req, res) => {
  const validation = validateLoginBody(req.body);
  if (!validation.ok) {
    return res.status(400).json({ message: validation.message });
  }
  const { email, password } = validation;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password) {
      return res.status(403).json({
        message: "This account uses Google sign-in. Please use Sign in with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

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
        ...verificationCodeResponseField(emailSent, otp),
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
        isOrganizer: user.role === "organizer",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Return success
    res.status(200).json({
      message: "Login successful ✅",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
        isOrganizer: user.role === "organizer",
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// VERIFY EMAIL CONTROLLER
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

// FORGOT PASSWORD CONTROLLER
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Reset Your Password - Ticki",
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

// RESET PASSWORD CONTROLLER
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

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

async function ensureUniqueUsername(base) {
  const clean = String(base || "user")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 24) || "user";
  let username = clean;
  let suffix = 0;
  while (await User.findOne({ username })) {
    suffix += 1;
    username = `${clean.slice(0, 18)}${suffix.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  }
  return username;
}

exports.firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    const decoded = await verifyIdToken(idToken);
    const email = decoded.email;
    const firebaseUid = decoded.uid;
    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    let user = await User.findOne({ firebaseUid });
    if (!user) user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const displayName = decoded.name || email.split("@")[0];
      const username = await ensureUniqueUsername(displayName);
      user = new User({
        name: displayName,
        username,
        email: email.toLowerCase(),
        firebaseUid,
        isVerified: true,
        role: "user",
      });
      await user.save();
    } else {
      if (!user.firebaseUid) user.firebaseUid = firebaseUid;
      if (!user.isVerified) user.isVerified = true;
      await user.save();
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
        isOrganizer: user.role === "organizer",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
        isOrganizer: user.role === "organizer",
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("❌ FIREBASE LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================================================================
// 📧 EMAIL VERIFICATION WITH OTP (Firebase + OTP Flow)
// =====================================================================

/**
 * FIREBASE SYNC - Handle user signup via Firebase
 * 1. Verify Firebase ID token
 * 2. Extract email/name from token
 * 3. Create or update user in DB
 * 4. If new user: Generate 6-digit OTP & send email
 * 5. Return user verification status
 */
exports.firebaseSync = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    // Verify Firebase token
    const decoded = await verifyIdToken(idToken);
    const { email: firebaseEmail, name: firebaseName, uid: firebaseUid } = decoded;

    if (!firebaseEmail) {
      return res.status(400).json({ message: "Email not found in Firebase token" });
    }

    const emailLower = firebaseEmail.toLowerCase();

    // Check if user exists
    let user = await User.findOne({ $or: [{ firebaseUid }, { email: emailLower }] });

    if (!user) {
      // 🆕 CREATE NEW USER with unverified status
      const displayName = firebaseName || firebaseEmail.split("@")[0];
      const username = await ensureUniqueUsername(displayName);

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

      user = new User({
        name: displayName,
        username,
        email: emailLower,
        firebaseUid,
        isVerified: false, // ✅ Not verified until OTP is verified
        verificationCode: hashedOtp,
        verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      });

      await user.save();

      const emailResult = await sendEmail({
        to: emailLower,
        subject: "Verify Your Email - TickiSpot",
        html: otpEmail(otp),
      });

      const emailSent = Boolean(emailResult.success);

      return res.status(201).json({
        message: emailSent
          ? "User created. Check your email for your verification code."
          : "User created. Copy your verification code below, then enter it to verify.",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isVerified: false,
        },
        ...verificationCodeResponseField(emailSent, otp),
      });
    } else {
      // 👤 USER EXISTS
      // If they haven't verified yet, regenerate OTP
      if (!user.isVerified) {
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

        return res.status(200).json({
          message: emailSent
            ? "A new verification code was sent to your email."
            : "Copy your new verification code below.",
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            isVerified: false,
          },
          ...verificationCodeResponseField(emailSent, otp),
        });
      }

      // ✅ USER ALREADY VERIFIED - Return JWT
      const token = jwt.sign(
        {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isAdmin: user.role === "admin",
          isOrganizer: user.role === "organizer",
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "User verified. Login successful.",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isVerified: true,
          profilePic: user.profilePic,
        },
      });
    }
  } catch (error) {
    console.error("❌ FIREBASE SYNC ERROR:", error);
    res.status(500).json({ message: "Server error during Firebase sync" });
  }
};

/**
 * VERIFY EMAIL - Verify OTP code
 * 1. User submits 6-digit OTP
 * 2. Hash the OTP and compare with stored hash
 * 3. Check expiration
 * 4. If valid: Set isVerified=true, remove OTP fields
 * 5. Return JWT token
 */
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

    // Check if OTP exists and not expired
    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({ message: "No verification code found. Please request a new one." });
    }

    if (new Date() > user.verificationCodeExpires) {
      return res.status(400).json({
        message: "Verification code expired. Please request a new one.",
        code: "OTP_EXPIRED",
      });
    }

    // Hash the provided OTP and compare
    const hashedInputOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedInputOtp !== user.verificationCode) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ OTP VALID - Mark as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Create JWT
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
        isOrganizer: user.role === "organizer",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Email verified successfully! ✅",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: true,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("❌ VERIFY EMAIL OTP ERROR:", error);
    res.status(500).json({ message: "Server error verifying OTP" });
  }
};

/**
 * RESEND OTP - Generate and send new verification code
 * 1. Find user by email
 * 2. Generate new 6-digit OTP
 * 3. Send email
 * 4. Store hashed OTP with 10-min expiration
 */
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

    // Generate new 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.verificationCode = hashedOtp;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
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

