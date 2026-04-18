const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const { createNotification } = require("../services/notificationService");
const { buildTimeline, recordEventMetrics } = require("../utils/eventMetrics");

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

const buildEventPayload = (event, currentUserId) => {
  const data = event.toObject ? event.toObject() : event;
  const likes = Array.isArray(data.likes) ? data.likes : [];
  const likeIds = likes.map((like) =>
    typeof like === "string" ? like : String(like?._id || like),
  );

  return {
    ...data,
    likes,
    likeCount: likeIds.length,
    commentCount: Array.isArray(data.comments) ? data.comments.length : 0,
    viewCount: Number(data.viewCount || 0),
    shareCount: Number(data.shareCount || 0),
    isLiked: currentUserId ? likeIds.includes(String(currentUserId)) : false,
    comments: enrichComments(data.comments || []),
  };
};

const eventPopulateOptions = [
  { path: "createdBy", select: "name username email profilePic role isVerified billing" },
  { path: "comments.user", select: "name username profilePic billing" },
];

const getEventByIdForOwner = async (eventId, userId, allowAdmin = false, userRole = "user") => {
  const event = await Event.findById(eventId);
  if (!event) return { error: { status: 404, message: "Event not found" } };

  const isOwner = String(event.createdBy) === String(userId);
  const isAdmin = allowAdmin && userRole === "admin";

  if (!isOwner && !isAdmin) {
    return { error: { status: 403, message: "Unauthorized" } };
  }

  return { event };
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
      streamType,
      streamURL,
    } = req.body;

    const imagePath = req.file ? req.file.filename : null;

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
      pricing: pricing ? JSON.parse(pricing) : [],
      totalTickets,
      eventType,
      liveStream: {
        isLive: false,
        streamType,
        streamURL,
      },
      createdBy: req.user.id,
    });

    await newEvent.save();
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
    const filter = liveOnly === "true" ? { "liveStream.isLive": true } : {};
    const events = await Event.find(filter)
      .populate(eventPopulateOptions)
      .sort({ createdAt: -1 });

    res.status(200).json(events.map((event) => buildEventPayload(event, currentUserId)));
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

    res.status(200).json(buildEventPayload(event, currentUserId));
  } catch (err) {
    console.error("Error fetching event by ID:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const myEvents = await Event.find({ createdBy: userId })
      .populate(eventPopulateOptions)
      .sort({ createdAt: -1 });

    res.status(200).json(myEvents.map((event) => buildEventPayload(event, userId)));
  } catch (error) {
    console.error("Error fetching user events:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getEventBuyers = async (req, res) => {
  try {
    const { eventId } = req.params;
    const lookup = await getEventByIdForOwner(eventId, req.user.id);
    if (lookup.error) {
      return res.status(lookup.error.status).json({ message: lookup.error.message });
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
    const lookup = await getEventByIdForOwner(eventId, req.user.id);
    if (lookup.error) {
      return res.status(lookup.error.status).json({ message: lookup.error.message });
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
    const lookup = await getEventByIdForOwner(eventId, req.user.id);
    if (lookup.error) {
      return res.status(lookup.error.status).json({ message: lookup.error.message });
    }

    const event = lookup.event;
    const updates = { ...req.body };

    if (updates.pricing) {
      try {
        updates.pricing = JSON.parse(updates.pricing);
      } catch {
        // Ignore if already parsed.
      }
    }

    if (req.file) {
      if (event.image) {
        const oldImagePath = path.join(__dirname, "../uploads/event_image", event.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }

      updates.image = req.file.filename;
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
    const lookup = await getEventByIdForOwner(eventId, req.user.id);
    if (lookup.error) {
      return res.status(lookup.error.status).json({ message: lookup.error.message });
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

    event.viewCount += 1;
    recordEventMetrics(event, { views: 1 });
    await event.save();

    res.status(200).json(buildEventPayload(event, getCurrentUserIdFromRequest(req)));
  } catch (err) {
    console.error("Error tracking event view:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.toggleEventLike = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);
    if (!event) return res.status(404).json({ message: "Event not found" });

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
    const lookup = await getEventByIdForOwner(
      req.params.id,
      req.user.id,
      true,
      req.user.role,
    );

    if (lookup.error) {
      return res.status(lookup.error.status).json({ message: lookup.error.message });
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
