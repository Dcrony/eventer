const bcrypt = require("bcryptjs");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");

const buildProfileStats = (user, createdEvents = []) => ({
  followers: Array.isArray(user.followers) ? user.followers.length : 0,
  following: Array.isArray(user.following) ? user.following.length : 0,
  events: createdEvents.length,
  totalViews: createdEvents.reduce((sum, event) => sum + Number(event.viewCount || 0), 0),
  totalLikes: createdEvents.reduce(
    (sum, event) => sum + (Array.isArray(event.likes) ? event.likes.length : 0),
    0,
  ),
  totalComments: createdEvents.reduce(
    (sum, event) => sum + (Array.isArray(event.comments) ? event.comments.length : 0),
    0,
  ),
  totalShares: createdEvents.reduce((sum, event) => sum + Number(event.shareCount || 0), 0),
});

const buildProfileEventPayload = (event, currentUserId, extras = {}) => {
  const data = event.toObject ? event.toObject() : event;
  const likes = Array.isArray(data.likes) ? data.likes : [];
  const likeIds = likes.map((like) => String(like?._id || like));

  const payload = {
    ...data,
    likeCount: likeIds.length,
    commentCount: Array.isArray(data.comments) ? data.comments.length : 0,
    viewCount: Number(data.viewCount || 0),
    shareCount: Number(data.shareCount || 0),
    isLiked: currentUserId ? likeIds.includes(String(currentUserId)) : false,
  };

  if (typeof extras.isFavorited === "boolean") {
    payload.isFavorited = extras.isFavorited;
  }

  return payload;
};

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

const getMyProfile = async (req, res) => {
  try {
    const uid = req.user._id || req.user.id;
    if (!uid) {
      return res.status(400).json({ message: "User ID not found in request" });
    }

    const user = await User.findById(uid).select("-password").populate({
      path: "favorites",
      populate: { path: "createdBy", select: "name username profilePic role billing isVerified" },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const userId = uid;
    const tickets = await Ticket.find({ buyer: userId }).populate("event").exec();
    const createdEvents = await Event.find({ createdBy: userId })
      .populate("createdBy", "name username profilePic role billing isVerified")
      .exec();
    const likedEvents = await Event.find({ likes: userId })
      .populate("createdBy", "name username profilePic role billing isVerified")
      .sort({ createdAt: -1 })
      .exec();

    res.json({
      ...user.toObject(),
      tickets: tickets
        .filter((ticket) => ticket.event)
        .map((ticket) => ({
          ...ticket.toObject(),
          event: {
            ...ticket.event.toObject(),
            date: formatDate(ticket.event.date),
          },
        })),
      createdEvents: createdEvents.map((event) =>
        buildProfileEventPayload(
          {
            ...event.toObject(),
            date: formatDate(event.date),
          },
          userId,
        ),
      ),
      likedEvents: likedEvents.map((event) => buildProfileEventPayload(event, userId)),
      savedEvents: (user.favorites || []).map((event) =>
        buildProfileEventPayload(event, userId, { isFavorited: true }),
      ),
      stats: buildProfileStats(user, createdEvents),
      isOwner: true,
      isFollowing: false,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, username, email, phone, bio, currentPassword, newPassword } = req.body;

    if (name) user.name = name;
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;

    if (currentPassword && newPassword) {
      if (!user.password) {
        return res.status(400).json({
          message: "This account uses Google sign-in. Password change is not available here.",
        });
      }

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

const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ buyer: req.user._id }).populate("event");
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

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

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

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

const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const toggleFollow = async (req, res) => {
  try {
    if (!req.user?.id) {
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
      (id) => id.toString() === targetUserId.toString(),
    );

    if (isFollowing) {
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      await createNotification(req.app, {
        userId: targetUserId,
        actorId: currentUserId,
        type: "follow",
        message: `${currentUser.name} started following you`,
        actionUrl: `/users/${currentUserId}`,
        entityId: currentUserId,
        entityType: "user",
      });
    }

    await currentUser.save();
    await targetUser.save();

    res.json({ success: true, following: currentUser.following });
  } catch (err) {
    console.error("Toggle follow error:", err);
    res.status(500).json({ msg: err.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user._id || req.user.id;

    const user = await User.findById(userId)
      .select("-password")
      .populate({
        path: "favorites",
        populate: { path: "createdBy", select: "name username profilePic role billing isVerified" },
      })
      .populate("followers", "_id name username profilePic")
      .populate("following", "_id name username profilePic");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const tickets = await Ticket.find({ buyer: userId }).populate("event");
    const createdEvents = await Event.find({ createdBy: userId })
      .populate("createdBy", "name username profilePic role billing isVerified");
    const likedEvents = await Event.find({ likes: userId })
      .populate("createdBy", "name username profilePic role billing isVerified")
      .sort({ createdAt: -1 });
    const isOwner = String(currentUserId) === String(userId);
    const isFollowing = user.followers.some(
      (follower) => follower._id.toString() === String(currentUserId),
    );

    const base = user.toObject();
    if (!isOwner) {
      delete base.favorites;
    }

    res.json({
      ...base,
      tickets,
      createdEvents: createdEvents.map((event) => buildProfileEventPayload(event, currentUserId)),
      likedEvents: likedEvents.map((event) => buildProfileEventPayload(event, currentUserId)),
      savedEvents: isOwner
        ? (user.favorites || []).map((event) =>
            buildProfileEventPayload(event, currentUserId, { isFavorited: true }),
          )
        : [],
      stats: buildProfileStats(user, createdEvents),
      isOwner,
      isFollowing,
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const user = await User.findOne(isObjectId ? { _id: identifier } : { username: identifier })
      .select("-password")
      .populate({
        path: "favorites",
        populate: { path: "createdBy", select: "name username profilePic role billing isVerified" },
      })
      .populate("followers", "_id name username profilePic")
      .populate("following", "_id name username profilePic");

    if (!user) return res.status(404).json({ msg: "User not found" });

    const createdEvents = await Event.find({ createdBy: user._id })
      .populate("createdBy", "name username profilePic role billing isVerified")
      .sort({ createdAt: -1 });
    const likedEvents = await Event.find({ likes: user._id })
      .populate("createdBy", "name username profilePic role billing isVerified")
      .sort({ createdAt: -1 });

    const pub = user.toObject();
    delete pub.favorites;

    return res.json({
      ...pub,
      createdEvents: createdEvents.map((event) => buildProfileEventPayload(event, null)),
      likedEvents: likedEvents.map((event) => buildProfileEventPayload(event, null)),
      savedEvents: [],
      stats: buildProfileStats(user, createdEvents),
      isOwner: false,
      isFollowing: false,
      isPublic: true,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const upgradeMyPlan = async (req, res) => {
  try {
    const allowed = ["free", "pro", "business"];
    const nextPlan = String(req.body.plan || "").toLowerCase();
    if (!allowed.includes(nextPlan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.plan = nextPlan;
    await user.save();

    const updated = user.toObject();
    delete updated.password;

    return res.json({
      message: "Plan updated",
      plan: user.plan,
      user: updated,
    });
  } catch (err) {
    console.error("upgradeMyPlan error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const deactivateAccount = async (req, res) => {
  try {
    if (String(req.params.id) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only deactivate your own account" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Account deactivated", user });
  } catch (err) {
    res.status(500).json({ message: "Error deactivating account" });
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
  getPublicProfile,
  upgradeMyPlan,
  deactivateAccount,
};
