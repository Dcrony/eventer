const mongoose = require("mongoose");
const Event = require("../models/Event");
const User = require("../models/User");

const eventPopulate = [
  { path: "createdBy", select: "name username profilePic role isVerified billing" },
  { path: "comments.user", select: "name username profilePic billing" },
];

exports.toggleFavorite = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!Array.isArray(user.favorites)) {
      user.favorites = [];
    }

    const exists = user.favorites.some((id) => String(id) === String(eventId));

    if (exists) {
      user.favorites.pull(eventId);
    } else {
      user.favorites.push(eventId);
    }

    await user.save();

    return res.status(200).json({
      success: true,
      isFavorited: !exists,
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("toggleFavorite error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id).populate({
      path: "favorites",
      populate: eventPopulate,
      options: { sort: { createdAt: -1 } },
    });

    return res.status(200).json(user?.favorites || []);
  } catch (error) {
    console.error("getFavorites error", error);
    return res.status(500).json({ message: "Server error" });
  }
};
