const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role, // 👈 include role
        isAdmin: user.role === "admin", // 👈 or explicitly add isAdmin
        isOrganizer: user.role === "organizer", // 👈 or explicitly add isOrganizer
      },
      JWT_SECRET,
      { expiresIn: "4d" }
    );

    // 4. Send token and user data
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role, // ✅ keep role
        isAdmin: user.role === "admin", // ✅ derived
        isOrganizer: user.role === "organizer", // ✅ derived
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
