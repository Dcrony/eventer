const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");
const { hasAccess } = require("../services/featureService");
const { buildTimeline, recordEventMetrics } = require("../utils/eventMetrics");
const {
  getEventAccessForUser,
  authorizeEventAction,
  toSerializableAccess,
} = require("../utils/eventPermissions");
const {
  buildPublicEventQuery,
  canViewEvent,
  normalizeVisibility,
} = require("../utils/eventVisibility");
const {
  isConfigured,
  uploadImageBuffer,
  destroyCloudinaryImage,
} = require("../utils/cloudinaryMedia");

const JWT_SECRET = process.env.JWT_SECRET;

const getCurrentUserIdFromRequest = (req) => {
  try {
    if (req.user?.id) return String(req.user.id);

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ") || !JWT_SECRET) return null;

    const token = authHeader.split(" ")[1]?.trim();
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded?.id ? String(decoded.id) : null;
  } catch {
    return null;
  }
};

const enrichComments = (comments = []) =>
  comments.map((comment) => ({
    ...comment,
    user: comment.user
      ? {
          _id: comment.user._id,
          name: comment.user.name,
          username: comment.user.username,
          profilePic: comment.user.profilePic,
          billing: comment.user.billing,
        }
      : null,
  }));

const buildEventPayload = (event, currentUserId, extras = {}) => {
  const data = event?.toObject ? event.toObject() : event;

  if (!data) return null;

  const likes = Array.isArray(data.likes) ? data.likes : [];

  const likeIds = likes.map((like) =>
    typeof like === "string"
      ? like
      : String(like?._id || like || ""),
  );

  return {
    ...data,

    createdBy: data.createdBy || null,

    likes,
    likeCount: likeIds.length,

    commentCount: Array.isArray(data.comments)
      ? data.comments.length
      : 0,

    viewCount: Number(data.viewCount || 0),
    shareCount: Number(data.shareCount || 0),

    isLiked: currentUserId
      ? likeIds.includes(String(currentUserId))
      : false,

    comments: enrichComments(
      Array.isArray(data.comments) ? data.comments : [],
    ),
    ...extras,
  };
};

const eventPopulateOptions = [
  { path: "createdBy", select: "name username email profilePic role isVerified billing" },
  { path: "comments.user", select: "name username profilePic billing" },
];

const DEFAULT_FREE_PRICING = [{ type: "Free", price: 0 }];

const parseBooleanFlag = (value) => value === true || value === "true";

const normalizePricingInput = (pricing) => {
  if (pricing == null || pricing === "") return [];

  let parsedPricing = pricing;
  if (typeof pricing === "string") {
    parsedPricing = JSON.parse(pricing);
  }

  if (!Array.isArray(parsedPricing)) {
    throw new Error("Invalid pricing data.");
  }

  return parsedPricing
    .map((tier) => ({
      type: String(tier?.type || "").trim(),
      price: Number(tier?.price || 0),
    }))
    .filter((tier) => tier.type);
};

const resolveEventPricing = (pricing, isFree) => {
  if (isFree) {
    return DEFAULT_FREE_PRICING;
  }

  const normalizedPricing = normalizePricingInput(pricing);
  if (!normalizedPricing.length) {
    throw new Error("At least one pricing tier is required for paid events.");
  }

  if (!normalizedPricing.some((tier) => Number(tier.price) > 0)) {
    throw new Error("At least one pricing tier must be greater than 0 for paid events.");
  }

  return normalizedPricing;
};

exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      startDate,
      startTime,
      endDate,
      endTime,
      location,
      pricing,
      totalTickets,
      eventType,
      visibility,
      streamType,
      streamURL,
    } = req.body;
    const isFree = parseBooleanFlag(req.body.isFree) || parseBooleanFlag(req.body.isFreeEvent);
    const normalizedVisibility = normalizeVisibility(visibility);

    if (normalizedVisibility === "private" && !hasAccess(req.user, "PRIVATE_EVENTS")) {
      return res.status(403).json({
        code: "PLAN_UPGRADE_REQUIRED",
        message: "Upgrade to Pro to access this feature",
      });
    }

    let resolvedPricing = DEFAULT_FREE_PRICING;
    try {
      resolvedPricing = resolveEventPricing(pricing, isFree);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    let imagePath = null;
    if (req.file) {
      if (!isConfigured()) {
        return res.status(503).json({ message: "Image storage is not configured on the server." });
      }
      const uploaded = await uploadImageBuffer(req.file.buffer, { folder: "eventer/events" });
      imagePath = uploaded.secure_url;
    }

    const newEvent = new Event({
      title,
      description,
      category,
      startDate,
      startTime,
      endDate,
      endTime,
      location,
      image: imagePath,
      pricing: resolvedPricing,
      isFree,
      isFreeEvent: isFree,
      totalTickets,
      eventType,
      visibility: normalizedVisibility,
      liveStream: {
        isLive: false,
        streamType,
        streamURL,
      },
      createdBy: req.user.id,
    });

    await newEvent.save();

    await User.findByIdAndUpdate(req.user._id || req.user.id, { $inc: { eventCount: 1 } });

    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    console.error("Event creation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const { liveOnly } = req.query;
    const currentUserId = getCurrentUserIdFromRequest(req);
    const filter = buildPublicEventQuery(
      liveOnly === "true" ? { "liveStream.isLive": true } : {},
    );
    const events = await Event.find(filter)
  .populate(eventPopulateOptions)
  .sort({ createdAt: -1 });

const validEvents = events.filter((event) => event.createdBy);

const payload = validEvents
  .map((event) => buildEventPayload(event, currentUserId))
  .filter(Boolean);

res.status(200).json(payload);

  } catch (err) {
    console.error("Error fetching all events:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const currentUserId = getCurrentUserIdFromRequest(req);
    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);

    if (!event) return res.status(404).json({ message: "Event not found" });
    const visibility = await canViewEvent(event, currentUserId, {
      allowPrivateLink: true,
    });
    if (!visibility.allowed) {
      return res.status(404).json({ message: "Event not found" });
    }

    const access = currentUserId
      ? await getEventAccessForUser(event, currentUserId)
      : null;

    res.status(200).json(
      buildEventPayload(event, currentUserId, {
        eventAccess: access ? toSerializableAccess(access) : null,
      }),
    );
  } catch (err) {
    console.error("Error fetching event by ID:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log("Fetching events for:", userId);

    const events = await Event.find({ createdBy: userId })
      .populate(eventPopulateOptions)
      .sort({ createdAt: -1 });

    console.log("Found events:", events.length);

    const validEvents = events.filter((event) => event?.createdBy);

    const payload = validEvents
      .map((event) =>
        buildEventPayload(event, userId, {
          eventAccess: toSerializableAccess({
            hasAccess: true,
            isOwner: true,
            isAdmin: req.user.role === "admin",
            isCollaborator: false,
            role: "owner",
            permissions: null,
            featureAccess: {
              analytics: hasAccess(req.user, "ANALYTICS_ADVANCED"),
              liveStream: hasAccess(req.user, "LIVE_STREAM"),
              teamMembers: hasAccess(req.user, "TEAM_MEMBERS"),
              refunds: hasAccess(req.user, "REFUNDS"),
            },
          }),
        }),
      )
      .filter(Boolean);

    res.status(200).json(payload);
  } catch (error) {
    console.error("GET MY EVENTS ERROR:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};



exports.getEventBuyers = async (req, res) => {
  try {
    const { eventId } = req.params;
    const lookup = await authorizeEventAction({
      eventId,
      user: req.user,
      permission: "canManageTickets",
      deniedMessage: "You do not have permission to view ticket sales for this event",
    });
    if (lookup.error) {
      return res.status(lookup.error.status).json({
        message: lookup.error.message,
        ...(lookup.error.code ? { code: lookup.error.code } : {}),
      });
    }

    const tickets = await Ticket.find({ event: eventId })
      .populate("buyer", "name username email profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (err) {
    console.error("Error fetching event buyers:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.toggleLiveStream = async (req, res) => {
  const { eventId, isLive } = req.body;

  try {
    const lookup = await authorizeEventAction({
      eventId,
      user: req.user,
      permission: "canModerateLivestream",
      deniedMessage: "You do not have permission to manage this livestream",
    });
    if (lookup.error) {
      return res.status(lookup.error.status).json({
        message: lookup.error.message,
        ...(lookup.error.code ? { code: lookup.error.code } : {}),
      });
    }

    lookup.event.liveStream.isLive = isLive;
    await lookup.event.save();

    res.status(200).json({
      message: `Stream is now ${isLive ? "LIVE" : "OFF"}`,
      event: lookup.event,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const lookup = await authorizeEventAction({
      eventId,
      user: req.user,
      permission: "canEditEvent",
      deniedMessage: "You do not have permission to edit this event",
    });
    if (lookup.error) {
      return res.status(lookup.error.status).json({
        message: lookup.error.message,
        ...(lookup.error.code ? { code: lookup.error.code } : {}),
      });
    }

    const event = lookup.event;
    const updates = { ...req.body };
    const isFree = parseBooleanFlag(updates.isFree) || parseBooleanFlag(updates.isFreeEvent);
    const normalizedVisibility = normalizeVisibility(updates.visibility || event.visibility);

    if (normalizedVisibility === "private" && !hasAccess(req.user, "PRIVATE_EVENTS")) {
      return res.status(403).json({
        code: "PLAN_UPGRADE_REQUIRED",
        message: "Upgrade to Pro to access this feature",
      });
    }

    try {
      updates.pricing = resolveEventPricing(updates.pricing, isFree);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    updates.isFree = isFree;
    updates.isFreeEvent = isFree;
    updates.visibility = normalizedVisibility;

    if (req.file) {
      if (!isConfigured()) {
        return res.status(503).json({ message: "Image storage is not configured on the server." });
      }
      if (event.image) {
        if (String(event.image).startsWith("http")) {
          await destroyCloudinaryImage(event.image);
        } else {
          const oldImagePath = path.join(__dirname, "../uploads/event_image", event.image);
          if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        }
      }
      const uploaded = await uploadImageBuffer(req.file.buffer, { folder: "eventer/events" });
      updates.image = uploaded.secure_url;
    }

    if (updates.streamType || updates.streamURL) {
      event.liveStream = {
        ...event.liveStream,
        streamType: updates.streamType || event.liveStream.streamType,
        streamURL: updates.streamURL || event.liveStream.streamURL,
      };
      delete updates.streamType;
      delete updates.streamURL;
    }

    Object.assign(event, updates);
    await event.save();

    res.status(200).json({
      message: "Event updated successfully",
      event,
    });
  } catch (err) {
    console.error("Update Event Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const lookup = await authorizeEventAction({
      eventId,
      user: req.user,
      permission: "canDeleteEvent",
      deniedMessage: "You do not have permission to delete this event",
    });
    if (lookup.error) {
      return res.status(lookup.error.status).json({
        message: lookup.error.message,
        ...(lookup.error.code ? { code: lookup.error.code } : {}),
      });
    }

    const ev = lookup.event;
    if (ev.image) {
      if (String(ev.image).startsWith("http")) {
        await destroyCloudinaryImage(ev.image);
      } else {
        const oldImagePath = path.join(__dirname, "../uploads/event_image", ev.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
    }

    await Event.findByIdAndDelete(eventId);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.trackEventView = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const currentUserId = getCurrentUserIdFromRequest(req);
    const visibility = await canViewEvent(event, currentUserId, {
      allowPrivateLink: true,
    });
    if (!visibility.allowed) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.viewCount += 1;
    recordEventMetrics(event, { views: 1 });
    await event.save();

    res.status(200).json(buildEventPayload(event, currentUserId));
  } catch (err) {
    console.error("Error tracking event view:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleEventLike = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const visibility = await canViewEvent(event, req.user, {
      allowPrivateLink: true,
    });
    if (!visibility.allowed) {
      return res.status(404).json({ message: "Event not found" });
    }

    const userId = String(req.user.id);
    const existingIndex = event.likes.findIndex((like) => String(like) === userId);

    if (existingIndex >= 0) {
      event.likes.splice(existingIndex, 1);
    } else {
      event.likes.push(req.user.id);
      recordEventMetrics(event, { likes: 1 });

      if (String(event.createdBy?._id || event.createdBy) !== userId) {
        await createNotification(req.app, {
          userId: String(event.createdBy?._id || event.createdBy),
          actorId: req.user.id,
          type: "like",
          message: `${req.user.name || req.user.username} liked your event "${event.title}"`,
          actionUrl: `/Eventdetail/${event._id}`,
          entityId: event._id,
          entityType: "event",
        });
      }
    }

    await event.save();

    res.status(200).json(buildEventPayload(event, userId));
  } catch (err) {
    console.error("Error toggling event like:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getEventComments = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate({
      path: "comments.user",
      select: "name username profilePic billing",
    });

    if (!event) return res.status(404).json({ message: "Event not found" });
    const visibility = await canViewEvent(
      event,
      getCurrentUserIdFromRequest(req),
      { allowPrivateLink: true },
    );
    if (!visibility.allowed) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({
      comments: enrichComments(event.toObject().comments || []),
      commentCount: event.comments.length,
    });
  } catch (err) {
    console.error("Error fetching comments:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addEventComment = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const visibility = await canViewEvent(event, req.user, {
      allowPrivateLink: true,
    });
    if (!visibility.allowed) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.comments.unshift({
      user: req.user.id,
      text,
      createdAt: new Date(),
    });
    recordEventMetrics(event, { comments: 1 });
    await event.save();

    if (String(event.createdBy?._id || event.createdBy) !== String(req.user.id)) {
      await createNotification(req.app, {
        userId: String(event.createdBy?._id || event.createdBy),
        actorId: req.user.id,
        type: "comment",
        message: `${req.user.name || req.user.username} commented on "${event.title}"`,
        actionUrl: `/Eventdetail/${event._id}`,
        entityId: event._id,
        entityType: "event",
        meta: { preview: text.slice(0, 120) },
      });
    }

    const refreshed = await Event.findById(req.params.id).populate(eventPopulateOptions);
    res.status(201).json(buildEventPayload(refreshed, req.user.id));
  } catch (err) {
    console.error("Error adding comment:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.trackEventShare = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const visibility = await canViewEvent(
      event,
      getCurrentUserIdFromRequest(req),
      { allowPrivateLink: true },
    );
    if (!visibility.allowed) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.shareCount += 1;
    recordEventMetrics(event, { shares: 1 });
    await event.save();

    res.status(200).json(buildEventPayload(event, getCurrentUserIdFromRequest(req)));
  } catch (err) {
    console.error("Error tracking share:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getEventAnalytics = async (req, res) => {
  try {
    const lookup = await authorizeEventAction({
      eventId: req.params.id,
      user: req.user,
      permission: "canAccessAnalytics",
      deniedMessage: "You do not have permission to view analytics for this event",
    });

    if (lookup.error) {
      return res.status(lookup.error.status).json({
        message: lookup.error.message,
        ...(lookup.error.code ? { code: lookup.error.code } : {}),
      });
    }

    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);
    const timeline = buildTimeline(event, 14);
    const totalRevenue = timeline.reduce((sum, point) => sum + point.revenue, 0);
    const totalTimelineSales = timeline.reduce((sum, point) => sum + point.ticketsSold, 0);

    res.status(200).json({
      event: buildEventPayload(event, req.user.id),
      metrics: {
        totalViews: Number(event.viewCount || 0),
        ticketsSold: Number(event.ticketsSold || 0),
        revenue: totalRevenue,
        likes: Array.isArray(event.likes) ? event.likes.length : 0,
        comments: Array.isArray(event.comments) ? event.comments.length : 0,
        shares: Number(event.shareCount || 0),
        conversionRate:
          event.viewCount > 0 ? Number(((event.ticketsSold / event.viewCount) * 100).toFixed(1)) : 0,
      },
      charts: {
        timeline,
        summary: {
          views: timeline.reduce((sum, point) => sum + point.views, 0),
          sales: totalTimelineSales,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching event analytics:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.recordTicketPurchaseMetrics = (event, quantity, revenue) => {
  recordEventMetrics(event, {
    ticketsSold: Number(quantity || 0),
    revenue: Number(revenue || 0),
  });
};
