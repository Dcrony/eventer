const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { login } = require("../controllers/authControllers");
const jwt = require("jsonwebtoken");


// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profile_pic");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// POST /api/auth/register
router.post("/register", upload.single("profilePic"), async (req, res) => {
  try {
    const {  username, email, password, isAdmin, isOrganizer } = req.body;
    const profilePic = req.file ? req.file.filename : null;

     // 🟢 Decide role based on booleans
    let role = "user";
    if (isAdmin === "true") role = "admin";
    else if (isOrganizer === "true") role = "organizer";

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      profilePic,
    });

    await newUser.save();

    const token = jwt.sign(
  { 
    id: newUser._id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role, 
    isAdmin: newUser.isAdmin ,
    isOrganizer: newUser.isOrganizer,

  },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);


    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        isAdmin: newUser.isAdmin,
        isOrganizer: newUser.isOrganizer,
        profilePic: newUser.profilePic,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", login);

module.exports = router;
