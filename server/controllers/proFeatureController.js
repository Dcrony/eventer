const Event = require("../models/Event");
const EventTeam = require("../models/EventTeam");
const { hasProAccess } = require("../services/subscriptionService");

const proAccessPayload = (req, feature) => {
  const allowed = hasProAccess(req.user);
  return {
    access: allowed,
    feature,
    plan: req.user?.plan || "free",
    message: allowed
      ? `${feature} unlocked`
      : "Upgrade to Pro to access this feature",
  };
};

exports.getAnalyticsAccess = async (req, res) => {
  const payload = proAccessPayload(req, "analytics");
  return res.status(payload.access ? 200 : 403).json(payload);
};

exports.getLiveStreamAccess = async (req, res) => {
  const payload = proAccessPayload(req, "live_stream");
  return res.status(payload.access ? 200 : 403).json(payload);
};

exports.getTeamWorkspace = async (req, res) => {
  try {
    const payload = proAccessPayload(req, "team");
    if (!payload.access) {
      return res.status(403).json({ ...payload, members: [] });
    }

    const userId = req.user._id || req.user.id;
    const teams = await EventTeam.find({
      "members.user": userId,
      "members.isActive": true,
    })
      .populate("members.user", "name username profilePic role")
      .populate("event", "title startDate")
      .limit(20)
      .lean();

    const members = teams.flatMap((team) =>
      (team.members || []).map((m) => ({
        ...m,
        eventTitle: team.event?.title,
        eventId: team.event?._id,
      })),
    );

    return res.status(200).json({
      ...payload,
      members,
      teams,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load team workspace" });
  }
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
