const bcrypt = require("bcryptjs");
const User = require("../models/User.js");

const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateAccount = async (req, res) => {
  try {
    const updates = {};
    ["name", "username", "email", "phone", "bio"].forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({ message: "Account settings updated", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating account settings" });
  }
};

const updatePrivacy = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { privacy: { ...req.user.privacy?.toObject?.(), ...req.body } },
      { new: true },
    ).select("-password");

    res.json({ message: "Privacy updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating privacy settings" });
  }
};

const updateNotifications = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { notifications: { ...req.user.notifications?.toObject?.(), ...req.body } },
      { new: true },
    ).select("-password");

    res.json({ message: "Notifications updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating notifications" });
  }
};

const updateSecurity = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { currentPassword, newPassword, twoFactorEnabled } = req.body;

    if (typeof twoFactorEnabled === "boolean") {
      user.security = {
        ...user.security?.toObject?.(),
        twoFactorEnabled,
      };
    }

    if (newPassword) {
      if (!currentPassword || !user.password) {
        return res.status(400).json({ message: "Current password is required" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.security = {
        ...user.security?.toObject?.(),
        lastPasswordChange: new Date(),
      };
    }

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ message: "Security settings updated", user: safeUser });
  } catch (err) {
    res.status(500).json({ message: "Error updating security settings" });
  }
};

const updateEventPreferences = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        eventPreferences: {
          ...req.user.eventPreferences?.toObject?.(),
          ...req.body,
        },
      },
      { new: true },
    ).select("-password");

    res.json({ message: "Event preferences updated", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating event preferences" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting account" });
  }
};

module.exports = {
  getSettings,
  updateAccount,
  updatePrivacy,
  updateNotifications,
  updateSecurity,
  updateEventPreferences,
  deleteAccount,
};
