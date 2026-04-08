const Notification = require("../models/Notification");

// ✅ Create a new notification
const createNotification = async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    if (!userId || String(userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Can only create notifications for your own account" });
    }
    const notification = await Notification.create({
      user: userId,
      message,
      type,
    });

    const io = req.app.get("io");
    if (io) {
      io.emit(`notify_${userId}`, notification);
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all notifications for logged-in user
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Mark a single notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: "Marked as read", notification });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await notification.deleteOne();
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
