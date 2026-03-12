const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

    // Create new user
    const newUser = new User({
      name: username, // Use username as name since form only sends username
      username,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    // 🪪 Generate JWT
    const token = jwt.sign(
      {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isAdmin: newUser.role === "admin",
        isOrganizer: newUser.role === "organizer",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Success response
    res.status(201).json({
      message: "Registration successful ✅",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isAdmin: newUser.role === "admin",
        isOrganizer: newUser.role === "organizer",
      },
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
