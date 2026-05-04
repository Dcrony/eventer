const Event = require("../models/Event");

exports.getAnalyticsAccess = async (req, res) => {
  return res.status(200).json({
    message: "Advanced analytics unlocked",
    access: true,
  });
};

exports.getLiveStreamAccess = async (req, res) => {
  return res.status(200).json({
    message: "Live streaming unlocked",
    access: true,
  });
};

exports.getTeamWorkspace = async (req, res) => {
  return res.status(200).json({
    message: "Team workspace unlocked",
    members: [],
  });
};

exports.getPrivateEvents = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const events = await Event.find({
      createdBy: userId,
      visibility: "private",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Private events fetched successfully",
      events,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load private events" });
  }
};
