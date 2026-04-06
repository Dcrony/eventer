const User = require("../models/User");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket"); 
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");

// @desc   Get logged-in user profile with tickets and created events
// @route  GET /api/users/me
// @access Private
const getMyProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "User ID not found in request" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const userId = req.user.id;

    const tickets = await Ticket.find({ buyer: userId })
      .populate("event")
      .exec();

    const createdEvents = await Event.find({ createdBy: userId }).exec();

    const formatDate = (date) => {
      if (!date) return "No date";
      return new Date(date).toLocaleString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    };

    res.json({
      ...user.toObject(),
      tickets: tickets
        .filter((t) => t.event)
        .map((t) => ({
          ...t.toObject(),
          event: {
            ...t.event.toObject(),
            date: formatDate(t.event.date),
          },
        })),
      createdEvents: createdEvents.map((e) => ({
        ...e.toObject(),
        date: formatDate(e.date),
      })),
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update logged-in user profile (with password + bio support)
// @route  PUT /api/users/me
// @access Private
const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, username, email, phone, bio, currentPassword, newPassword } = req.body;

    // Basic info updates
    if (name) user.name = name;
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;

    // Handle password update
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
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
    user.profilePic = `${req.file.filename}`;
    await user.save();

    res.json({ message: "Profile picture updated", profilePic: user.profilePic });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Upload cover picture
// @route  POST /api/users/me/cover
// @access Private
const uploadCoverPic = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.coverPic = `${req.file.filename}`;
    await user.save();

    res.json({ message: "Cover picture updated", coverPic: user.coverPic });
  } catch (error) {
    console.error("Cover picture upload error:", error);
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

// @desc   Get all users (admin only)
// @route  GET /api/users
// @access Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
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

// Follow / Unfollow
const toggleFollow = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ msg: "You cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId.toString()
    );

    if (isFollowing) {
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      const notification = await Notification.create({
        user: targetUserId,
        message: `${currentUser.name} started following you`,
        type: "custom",
      });

      const io = req.app.get("io");
      if (io) io.emit(`notify_${targetUserId}`, notification);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({ success: true, following: currentUser.following });
  } catch (err) {
    console.error("Toggle follow error:", err);
    res.status(500).json({ msg: err.message });
  }
};

// Get user profile by ID
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user.id;

    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "_id name profilePic")
      .populate("following", "_id name profilePic");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const tickets = await Ticket.find({ buyer: userId }).populate("event");
    const createdEvents = await Event.find({ organizer: userId });
    const isOwner = currentUserId === userId;
    const isFollowing = user.followers.some(
      (f) => f._id.toString() === currentUserId
    );

    res.json({
      ...user.toObject(),
      tickets,
      createdEvents,
      stats: {
        followers: user.followers.length,
        following: user.following.length,
        events: createdEvents.length,
      },
      isOwner,
      isFollowing,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfilePic,
  uploadCoverPic,
  getMyTickets,
  updateUserRole,
  getAllUsers,
  deleteUser,
  getMyEvents,
  toggleFollow,
  getUserProfile,
};