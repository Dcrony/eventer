const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const { validateLoginBody, validateRegisterBody } = require("../utils/authValidation");

const JWT_SECRET = process.env.JWT_SECRET;

// 🟢 REGISTER CONTROLLER
exports.register = async (req, res) => {
  try {
    const validation = validateRegisterBody(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }
    const { username, email, password, isOrganizer, isAdmin } = validation;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already in use" });
    }

    // Determine user role
    let role = "user";
    if (isAdmin) role = "admin";
    else if (isOrganizer) role = "organizer";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    // Create new user
    const newUser = new User({
      name: username, // Use username as name since form only sends username
      username,
      email,
      password: hashedPassword,
      role,
      emailVerificationToken,
    });

    await newUser.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    await sendEmail({
      to: email,
      subject: "Verify Your Email - Ticki",
      html: `
        <h2>Welcome to Ticki!</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
    });

    // ✅ Success response (no token yet)
    res.status(201).json({
      message: "Registration successful! Please check your email to verify your account.",
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

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

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
