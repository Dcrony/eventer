const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const Event = require("../models/Event");
const EventTeam = require("../models/EventTeam");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const {
  isConfigured,
  uploadImageBuffer,
  destroyCloudinaryImage,
} = require("../utils/cloudinaryMedia");
const { createNotification } = require("../services/notificationService");
const {
  getEventAccessForUser,
  toSerializableAccess,
} = require("../utils/eventPermissions");
const {
  buildPublicEventQuery,
  filterViewableEvents,
} = require("../utils/eventVisibility");

const buildProfileStats = (user, createdEvents = [], extras = {}) => ({
  followers: Array.isArray(user.followers) ? user.followers.length : 0,
  following: Array.isArray(user.following) ? user.following.length : 0,
  events: createdEvents.length,
  totalEventsCreated: createdEvents.length,
  totalTicketsSold: Number(extras.totalTicketsSold || 0),
  totalFeaturedEvents: Number(extras.totalFeaturedEvents || 0),
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
  const { isFavorited, ...restExtras } = extras;

  const payload = {
    ...data,
    likeCount: likeIds.length,
    commentCount: Array.isArray(data.comments) ? data.comments.length : 0,
    viewCount: Number(data.viewCount || 0),
    shareCount: Number(data.shareCount || 0),
    isLiked: currentUserId ? likeIds.includes(String(currentUserId)) : false,
    ...restExtras,
  };

  if (typeof isFavorited === "boolean") {
    payload.isFavorited = isFavorited;
  }

  return payload;
};

const getProfileFeaturedEvents = async (profileUserId, viewerUser, options = {}) => {
  const includePrivate = Boolean(options.includePrivate);

  // ✅ Only fetch events where user is a collaborator, NOT owner
  const collaboratorTeams = await EventTeam.find({
    members: {
      $elemMatch: {
        user: profileUserId,
        isActive: true,
      },
    },
  }).populate({
    path: "event",
    match: {
      ...buildPublicEventQuery(),
      createdBy: { $ne: profileUserId }, // 🔒 exclude events they own
    },
    populate: {
      path: "createdBy",
      select: "name username profilePic role billing isVerified plan trialEndsAt subscriptionStatus",
    },
  });

  const featuredMap = new Map();

  collaboratorTeams.forEach((team) => {
    if (!team.event) return; // filtered out by match above

    const member = team.members.find(
      (item) =>
        item?.isActive && String(item.user?._id || item.user) === String(profileUserId),
    );

    if (!member) return;

    const key = String(team.event._id);
    if (!featuredMap.has(key)) {
      featuredMap.set(key, {
        event: team.event,
        featuredRole: member.role,
        featuredSource: "collaborator",
      });
    }
  });

  const featuredEvents = await Promise.all(
    [...featuredMap.values()].map(async ({ event, featuredRole, featuredSource }) => {
      if (!includePrivate) {
        const [visibleEvent] = await filterViewableEvents([event], viewerUser, {
          allowPrivateLink: false,
        });
        if (!visibleEvent) return null;
      }

      const viewerAccess = viewerUser
        ? await getEventAccessForUser(event, viewerUser)
        : null;

      return buildProfileEventPayload(event, viewerUser?._id || viewerUser?.id || null, {
        featuredRole,
        featuredSource,
        eventAccess: viewerAccess ? toSerializableAccess(viewerAccess) : null,
      });
    }),
  );

  return featuredEvents.filter(Boolean).sort(
    (left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime(),
  );
};

const getTotalTicketsSoldForCreatedEvents = async (profileUserId) => {
  const createdEvents = await Event.find({ createdBy: profileUserId }).select("_id").lean();
  if (!createdEvents.length) return 0;

  const totals = await Ticket.aggregate([
    {
      $match: {
        event: {
          $in: createdEvents.map((event) => event._id),
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$quantity" },
      },
    },
  ]);

  return Number(totals[0]?.total || 0);
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
      .populate("createdBy", "name username profilePic role billing isVerified plan trialEndsAt subscriptionStatus")
      .exec();
    const likedEventDocs = await Event.find({ likes: userId })
      .populate("createdBy", "name username profilePic role billing isVerified plan trialEndsAt subscriptionStatus")
      .sort({ createdAt: -1 })
      .exec();
    const likedEvents = await filterViewableEvents(likedEventDocs, req.user, {
      allowPrivateLink: false,
    });
    const [featuredEvents, totalTicketsSold] = await Promise.all([
      getProfileFeaturedEvents(userId, req.user, { includePrivate: true }),
      getTotalTicketsSoldForCreatedEvents(userId),
    ]);

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
      featuredEvents,
      savedEvents: (user.favorites || []).map((event) =>
        buildProfileEventPayload(event, userId, { isFavorited: true }),
      ),
      stats: buildProfileStats(user, createdEvents, {
        totalTicketsSold,
        totalFeaturedEvents: featuredEvents.length,
      }),
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

    const { name, username, email, phone, bio, location, currentPassword, newPassword } = req.body;

   
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ 
          message: "Username already taken. Please choose another one.",
          field: "username"
        });
      }
      user.username = username;
    }

    // Check for duplicate email (if email is being changed)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          message: "Email already in use. Please use another email.",
          field: "email"
        });
      }
      user.email = email;
    }

    // Update other fields
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (location) user.location = location;

    // Handle password change
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
    
    // Handle MongoDB duplicate key error (as fallback)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const message = field === 'username' 
        ? "Username already taken. Please choose another one."
        : field === 'email'
        ? "Email already in use. Please use another email."
        : `${field} already exists`;
      
      return res.status(400).json({ message, field });
    }
    
    res.status(500).json({ message: "Server error" });
  }
};

const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!isConfigured()) {
      return res.status(503).json({ message: "Image storage is not configured on the server." });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profilePic) {
      if (String(user.profilePic).startsWith("http")) {
        await destroyCloudinaryImage(user.profilePic);
      } else {
        const oldPath = path.join(__dirname, "../uploads/profile_pic", user.profilePic);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const uploaded = await uploadImageBuffer(req.file.buffer, { folder: "eventer/profiles" });
    user.profilePic = uploaded.secure_url;
    await user.save();

    res.json({ message: "Profile picture updated", profilePic: user.profilePic });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    const message =
      error?.message && String(error.message).includes("Cloudinary")
        ? "Image upload failed. Check server image storage configuration."
        : "Server error";
    res.status(500).json({ message });
  }
};

const uploadCoverPic = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!isConfigured()) {
      return res.status(503).json({ message: "Image storage is not configured on the server." });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.coverPic) {
      if (String(user.coverPic).startsWith("http")) {
        await destroyCloudinaryImage(user.coverPic);
      } else {
        const oldPath = path.join(__dirname, "../uploads/cover_pic", user.coverPic);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const uploaded = await uploadImageBuffer(req.file.buffer, { folder: "eventer/covers" });
    user.coverPic = uploaded.secure_url;
    await user.save();

    res.json({ message: "Cover picture updated", coverPic: user.coverPic });
  } catch (error) {
    console.error("Cover picture upload error:", error);
    const message =
      error?.message && String(error.message).includes("Cloudinary")
        ? "Image upload failed. Check server image storage configuration."
        : "Server error";
    res.status(500).json({ message });
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
      .populate("followers", "_id name username profilePic ")
      .populate("following", "_id name username profilePic");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const tickets = await Ticket.find({ buyer: userId }).populate("event");
    const createdEventDocs = await Event.find({ createdBy: userId })
      .populate("createdBy", "name username profilePic role billing isVerified plan trialEndsAt subscriptionStatus");
    const likedEventDocs = await Event.find({ likes: userId })
      .populate("createdBy", "name username profilePic role billing isVerified plan trialEndsAt subscriptionStatus")
      .sort({ createdAt: -1 });
    const isOwner = String(currentUserId) === String(userId);
    const createdEvents = isOwner
      ? createdEventDocs
      : await filterViewableEvents(createdEventDocs, req.user, {
          allowPrivateLink: false,
        });
    const likedEvents = await filterViewableEvents(likedEventDocs, req.user, {
      allowPrivateLink: false,
    });
    const isFollowing = user.followers.some(
      (follower) => follower._id.toString() === String(currentUserId),
    );
    const featuredEvents = await getProfileFeaturedEvents(userId, req.user, {
      includePrivate: isOwner,
    });

    const base = user.toObject();
    if (!isOwner) {
      delete base.favorites;
    }

      res.json({
        ...base,
        tickets: isOwner ? tickets : [],
        createdEvents: createdEvents.map((event) => buildProfileEventPayload(event, currentUserId)),
        likedEvents: likedEvents.map((event) => buildProfileEventPayload(event, currentUserId)),
        featuredEvents,
      savedEvents: isOwner
        ? (user.favorites || []).map((event) =>
            buildProfileEventPayload(event, currentUserId, { isFavorited: true }),
          )
        : [],
      stats: buildProfileStats(user, createdEvents, {
        totalTicketsSold: createdEvents.reduce(
          (sum, event) => sum + Number(event.ticketsSold || 0),
          0,
        ),
        totalFeaturedEvents: featuredEvents.length,
      }),
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
      .populate("createdBy", "name username profilePic role billing isVerified plan trialEndsAt subscriptionStatus")
      .sort({ createdAt: -1 });
    const likedEventDocs = await Event.find({ likes: user._id })
      .populate("createdBy", "name username profilePic role billing isVerified plan trialEndsAt subscriptionStatus")
      .sort({ createdAt: -1 });
    const visibleCreatedEvents = await filterViewableEvents(createdEvents, null, {
      allowPrivateLink: false,
    });
    const likedEvents = await filterViewableEvents(likedEventDocs, null, {
      allowPrivateLink: false,
    });
    const featuredEvents = await getProfileFeaturedEvents(user._id, null, {
      includePrivate: false,
    });

    const pub = user.toObject();
    delete pub.favorites;

    return res.json({
      ...pub,
      createdEvents: visibleCreatedEvents.map((event) => buildProfileEventPayload(event, null)),
      likedEvents: likedEvents.map((event) => buildProfileEventPayload(event, null)),
      featuredEvents,
      savedEvents: [],
      stats: buildProfileStats(user, visibleCreatedEvents, {
        totalTicketsSold: visibleCreatedEvents.reduce(
          (sum, event) => sum + Number(event.ticketsSold || 0),
          0,
        ),
        totalFeaturedEvents: featuredEvents.length,
      }),
      isOwner: false,
      isFollowing: false,
      isPublic: true,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const upgradeMyPlan = async (req, res) => {
  return res.status(403).json({
    message:
      "Direct plan updates are disabled. Please use the billing flow at /api/billing/initialize.",
  });
};

const getCreators = async (req, res) => {
  try {
    const category = String(req.query.category || "all").toLowerCase();
    const sort = String(req.query.sort || "trending").toLowerCase();
    const match = { isDeleted: { $ne: true } };
    const publicEventMatch = buildPublicEventQuery();
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "events",
          let: { creatorId: "$_id" },
          pipeline: [
  {
    $match: {
      $expr: { $eq: ["$createdBy", "$$creatorId"] },
      visibility: "public",           
      status: "approved",             
    },
  },
],
          as: "events",
        },
      },
      {
        $addFields: {
          eventsCount: { $size: "$events" },
          followersCount: { $size: { $ifNull: ["$followers", []] } },
        },
      },
      {
        $match: {
          eventsCount: { $gt: 0 },
          ...(category !== "all"
            ? {
                events: {
                  $elemMatch: {
                    category: { $regex: `^${category}$`, $options: "i" },
                  },
                },
              }
            : {}),
        },
      },
      {
        $project: {
          password: 0,
          verificationCode: 0,
          resetPasswordToken: 0,
          subscriptionHistory: 0,
          emailVerificationToken: 0,
          resetPasswordExpires: 0,
          verificationCodeExpires: 0,
        },
      },
      {
        $sort:
          sort === "trending"
            ? { followersCount: -1, eventsCount: -1, createdAt: -1 }
            : { eventsCount: -1, followersCount: -1, createdAt: -1 },
      },
      { $limit: 30 },
    ];

    const creators = await User.aggregate(pipeline);
    return res.json(creators);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getFounderProfile = async (req, res) => {
  return res.json({
    name: "Ibrahim Abdulmajeed",
    title: "Founder of TickiSpot",
    bio: "Creator of TickiSpot, the event + community + creator platform.",
    portfolioUrl: "https://ibrahimabdulmajeed.dev",
    organization: "TickiSpot",
  });
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
  getCreators,
  getFounderProfile,
  deactivateAccount,
};
