const User = require("../models/User");
const Event = require("../models/Event");

const Ticket = require("../models/Ticket"); // assuming you have a Ticket model

// @desc   Get user profile by ID
// @route  GET /api/users/:id
// @access Private (or Public if you want organizers visible)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update logged-in user profile
// @route  PUT /api/users/me
// @access Private
const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Upload profile picture
// @route  POST /api/users/me/upload
// @access Private
const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);
    user.profilePic = `/uploads/${req.file.filename}`;
    await user.save();

    res.json({ message: "Profile picture updated", profilePic: user.profilePic });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Get tickets purchased by logged-in user
// @route  GET /api/users/my-tickets
// @access Private
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id }).populate("event");
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Admin: update user role
// @route  PUT /api/users/:id/role
// @access Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "organizer", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Get admin stats (users, active users, organizers)
// @route  GET /api/users/stats
// @access Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.json( users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// @desc   Delete a user (admin only)
// @route  DELETE /api/users/:id
// @access Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Get events created by logged-in organizer
// @route  GET /api/users/my-events
// @access Organizer
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getUserProfile,
  updateMyProfile,
  uploadProfilePic,
  getMyTickets,
  updateUserRole, // NEW
  getAllUsers,
  deleteUser,
  getMyEvents,
};
