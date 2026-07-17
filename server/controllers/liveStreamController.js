const Event = require("../models/Event");
const {
  authorizeEventAction,
  canModerateLivestream,
  getEventAccessForUser,
  getFeatureAccessForOwner,
} = require("../utils/eventPermissions");
const { isAttendeeForEvent } = require("../utils/eventVisibility");
const {
  buildChannelName,
  buildRtcToken,
  getAgoraConfig,
  uidFromUserId,
} = require("../services/agoraService");

exports.getAgoraToken = async (req, res) => {
  try {
    const { eventId } = req.params;
    const roleParam = String(req.query.role || "subscriber").toLowerCase();
    const role = roleParam === "publisher" ? "publisher" : "subscriber";

    if (!eventId) {
      return res.status(400).json({ message: "eventId is required" });
    }

    const { isConfigured } = getAgoraConfig();
    if (!isConfigured) {
      return res.status(503).json({
        code: "AGORA_NOT_CONFIGURED",
        message: "Live streaming is not configured on the server.",
      });
    }

    const event = await Event.findById(eventId).populate(
      "createdBy",
      "name username email profilePic role plan trialEndsAt subscriptionStatus organizerVerificationStatus organizerVerifiedAt organizerVerifiedBy",
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const ownerFeatures = await getFeatureAccessForOwner(event, req.user?.role === "admin");
    if (!ownerFeatures.liveStream) {
      return res.status(403).json({
        code: "PLAN_UPGRADE_REQUIRED",
        message: "This event organizer must upgrade to Pro for live streaming.",
      });
    }

    if (event.liveStream?.streamType && event.liveStream.streamType !== "Camera") {
      return res.status(400).json({
        message: "Agora tokens are only available for Camera (TickiSpot Live) streams.",
      });
    }

    const userId = String(req.user.id || req.user._id);
    const uid = uidFromUserId(userId);
    const channel = buildChannelName(eventId);

    if (role === "publisher") {
      const lookup = await authorizeEventAction({
        event,
        user: req.user,
        permission: "canModerateLivestream",
        deniedMessage: "You do not have permission to broadcast this livestream",
      });

      if (lookup.error) {
        return res.status(lookup.error.status).json({
          message: lookup.error.message,
          ...(lookup.error.code ? { code: lookup.error.code } : {}),
        });
      }
    } else {
      const access = await getEventAccessForUser(event, req.user);
      const isModerator = canModerateLivestream(access);

      if (!event.liveStream?.isLive) {
        return res.status(403).json({
          code: "STREAM_NOT_LIVE",
          message: "This stream is not live yet.",
        });
      }

      if (!isModerator) {
        const hasTicket = await isAttendeeForEvent(event._id, userId);
        if (!hasTicket) {
          return res.status(403).json({
            code: "TICKET_REQUIRED",
            message: "You need a valid ticket for this event to watch the live stream.",
          });
        }
      }
    }

    const payload = buildRtcToken({ channelName: channel, uid, role });

    return res.status(200).json({
      appId: payload.appId,
      channel: payload.channel,
      token: payload.token,
      uid: payload.uid,
      role,
    });
  } catch (error) {
    if (error.message === "AGORA_NOT_CONFIGURED") {
      return res.status(503).json({
        code: "AGORA_NOT_CONFIGURED",
        message: "Live streaming is not configured on the server.",
      });
    }
    console.error("getAgoraToken error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
