const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");
const OrganizerVerification = require("../models/OrganizerVerification");
const { createNotification } = require("../services/notificationService");
const { hasAccess } = require("../services/featureService");
const { buildTimeline, recordEventMetrics } = require("../utils/eventMetrics");
const {
  getEventAccessForUser,
  authorizeEventAction,
  toSerializableAccess,
  FULL_PERMISSIONS,
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

/**
 * Helper to check organizer verification status
 */
const getOrganizerVerificationStatus = async (userId) => {
  const verification = await OrganizerVerification.findOne({ 
    organizer: userId 
  }).sort({ createdAt: -1 });

  return {
    status: verification?.status || "not_started",
    isVerified: verification?.status === "approved",
    rejectionReason: verification?.rejectionReason,
  };
};

/* ─── Capacity fix ────────────────────────────────────────────────────────── */
exports.fixEventCapacity = async (req, res) => {
  try {
    const events = await Event.find({
      $or: [{ capacity: { $exists: false } }, { capacity: 0 }],
    });
    let fixed = 0;
    for (const event of events) {
      const remaining = Number(event.totalTickets || 0);
      const sold = Number(event.ticketsSold || 0);
      if (remaining > 0 || sold > 0) {
        event.capacity = remaining + sold;
        await event.save();
        fixed++;
      }
    }
    res.json({ message: "Capacity fix complete", fixed });
  } catch (err) {
    res.status(500).json({ message: "Fix failed", error: err.message });
  }
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const getCurrentUserIdFromRequest = (req) => {
  try {
    if (req.user?.id) return String(req.user.id);
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ") || !JWT_SECRET) return null;
    const token = authHeader.split(" ")[1]?.trim();
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    const id = decoded?.id || decoded?._id || decoded?.userId;
    return id ? String(id) : null;
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
    typeof like === "string" ? like : String(like?._id || like || "")
  );

  // Only surface enabled pricing tiers in the public payload
  const publicPricing = Array.isArray(data.pricing)
    ? data.pricing.filter((t) => t.isEnabled !== false)
    : [];

  return {
    ...data,
    pricing: publicPricing,
    createdBy: data.createdBy || null,
    likes,
    likeCount: likeIds.length,
    commentCount: Array.isArray(data.comments) ? data.comments.length : 0,
    viewCount: Number(data.viewCount || 0),
    shareCount: Number(data.shareCount || 0),
    isLiked: currentUserId ? likeIds.includes(String(currentUserId)) : false,
    comments: enrichComments(Array.isArray(data.comments) ? data.comments : []),
    ...extras,
  };
};

// For owner/edit views we expose ALL tiers (including disabled)
const buildEventPayloadFull = (event, currentUserId, extras = {}) => {
  const base = buildEventPayload(event, currentUserId, extras);
  if (!base) return null;
  const data = event?.toObject ? event.toObject() : event;
  return { ...base, pricing: Array.isArray(data.pricing) ? data.pricing : [] };
};

const eventPopulateOptions = [
  { path: "createdBy", select: "name username email profilePic role isVerified billing" },
  { path: "comments.user", select: "name username profilePic billing" },
];

const DEFAULT_FREE_PRICING = [{ type: "Free", price: 0, isEnabled: true, isFree: true }];

const parseBooleanFlag = (value) => value === true || value === "true";

/* ─── Pricing normalisation (NEW) ────────────────────────────────────────── */
/**
 * Normalises a raw pricing array coming from the client.
 * Each tier may now include:
 *   type, price, isEnabled, isFree, label, color, description, maxPerOrder
 */
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
      type:        String(tier?.type || "").trim(),
      price:       tier?.isFree ? 0 : Number(tier?.price || 0),
      isEnabled:   tier?.isEnabled !== false,           // default true
      isFree:      parseBooleanFlag(tier?.isFree),
      label:       String(tier?.label       || "").trim(),
      color:       String(tier?.color       || "").trim(),
      description: String(tier?.description || "").trim(),
      maxPerOrder: Number(tier?.maxPerOrder || 0),
    }))
    .filter((tier) => tier.type);
};

const resolveEventPricing = (pricing, isFree) => {
  if (isFree) return DEFAULT_FREE_PRICING;

  const normalizedPricing = normalizePricingInput(pricing);
  if (!normalizedPricing.length) {
    throw new Error("At least one pricing tier is required for paid events.");
  }

  // At least one ENABLED paid tier must exist (free-tier overrides don't count
  // as "paid event" validation — the event-level isFree flag controls that)
  const enabledTiers = normalizedPricing.filter((t) => t.isEnabled);
  if (!enabledTiers.length) {
    throw new Error("At least one ticket tier must be enabled.");
  }

  const hasPaidTier = enabledTiers.some((t) => !t.isFree && Number(t.price) > 0);
  if (!hasPaidTier) {
    throw new Error("At least one enabled tier must have a price greater than 0 for paid events.");
  }

  return normalizedPricing;
};

const sanitizeDraftTeamMembers = (value) => {
  if (!value) return [];
  let parsedValue = value;
  if (typeof value === "string") parsedValue = JSON.parse(value);
  if (!Array.isArray(parsedValue)) return [];
  return parsedValue
    .map((member) => ({
      email: String(member?.email || "").trim().toLowerCase(),
      role:  String(member?.role  || "Viewer").trim() || "Viewer",
    }))
    .filter((member) => member.email);
};

const buildEventDraftUpdate = (body, imagePath) => {
  const isFree = parseBooleanFlag(body.isFree) || parseBooleanFlag(body.isFreeEvent);
  const normalizedVisibility = normalizeVisibility(body.visibility);
  let normalizedPricing = [];

  try {
    normalizedPricing = isFree ? DEFAULT_FREE_PRICING : normalizePricingInput(body.pricing);
  } catch {
    normalizedPricing = isFree ? DEFAULT_FREE_PRICING : [];
  }

  return {
    title:       String(body.title       || "").trim(),
    description: String(body.description || "").trim(),
    category:    String(body.category    || "").trim(),
    startDate:   body.startDate || null,
    startTime:   body.startTime || "",
    endDate:     body.endDate   || null,
    endTime:     body.endTime   || "",
    location:    String(body.location || "").trim(),
    ...(imagePath ? { image: imagePath } : {}),
    pricing: normalizedPricing,
    isFree,
    isFreeEvent: isFree,
    totalTickets:     Number(body.totalTickets || 0),
    eventType:        body.eventType  || "In-person",
    visibility:       normalizedVisibility,
    liveStream: {
      isLive:     false,
      streamType: body.streamType || "",
      streamURL:  body.streamURL  || "",
    },
    draftStep:        Math.max(1, Number(body.draftStep || 1)),
    draftUpdatedAt:   new Date(),
    draftTeamMembers: sanitizeDraftTeamMembers(body.teamMembers),
  };
};

/* ─── Draft CRUD ──────────────────────────────────────────────────────────── */
exports.saveEventDraft = async (req, res) => {
  try {
    let imagePath = null;
    if (req.file) {
      if (!isConfigured()) {
        return res.status(503).json({ message: "Image storage is not configured on the server." });
      }
      const uploaded = await uploadImageBuffer(req.file.buffer, { folder: "eventer/events" });
      imagePath = uploaded.secure_url;
    }

    const updates = buildEventDraftUpdate(req.body, imagePath);
    const draftId = String(req.body.draftId || "").trim();
    let draft = null;

    if (draftId) {
      draft = await Event.findOne({ _id: draftId, createdBy: req.user.id, isDraft: true });
    }

    if (!draft) {
      draft = new Event({ ...updates, createdBy: req.user.id, isDraft: true, status: "pending" });
    } else {
      Object.assign(draft, updates);
    }

    await draft.save();
    return res.status(200).json({ message: "Draft saved", draft });
  } catch (error) {
    console.error("Save draft error:", error);
    return res.status(500).json({ message: "Failed to save draft", error: error.message });
  }
};

exports.getLatestEventDraft = async (req, res) => {
  try {
    const draft = await Event.findOne({ createdBy: req.user.id, isDraft: true })
      .populate(eventPopulateOptions)
      .sort({ draftUpdatedAt: -1, createdAt: -1 });
    return res.status(200).json({ draft });
  } catch (error) {
    console.error("Get latest draft error:", error);
    return res.status(500).json({ message: "Failed to fetch draft", error: error.message });
  }
};

exports.duplicateEvent = async (req, res) => {
  try {
    const source = await Event.findOne({ _id: req.params.eventId, createdBy: req.user.id });
    if (!source) return res.status(404).json({ message: "Event not found" });

    const duplicate = new Event({
      title:       `${source.title} Copy`,
      description: source.description,
      category:    source.category,
      startDate:   source.startDate,
      startTime:   source.startTime,
      endDate:     source.endDate,
      endTime:     source.endTime,
      location:    source.location,
      image:       source.image,
      pricing:     Array.isArray(source.pricing)
        ? source.pricing.map((tier) => ({
            type:        tier.type,
            price:       tier.price,
            isEnabled:   tier.isEnabled !== false,
            isFree:      Boolean(tier.isFree),
            label:       tier.label       || "",
            color:       tier.color       || "",
            description: tier.description || "",
            maxPerOrder: tier.maxPerOrder || 0,
          }))
        : [],
      isFree:       source.isFree,
      isFreeEvent:  source.isFreeEvent,
      totalTickets: source.totalTickets,
      eventType:    source.eventType,
      visibility:   source.visibility,
      liveStream:   source.liveStream,
      team:         source.team || null,
      createdBy:    req.user.id,
      isDraft:      true,
      draftStep:    1,
      draftUpdatedAt: new Date(),
    });

    await duplicate.save();
    return res.status(201).json({ message: "Event duplicated into draft", draft: duplicate });
  } catch (error) {
    console.error("Duplicate event error:", error);
    return res.status(500).json({ message: "Failed to duplicate event", error: error.message });
  }
};

/* ─── Create / Publish ────────────────────────────────────────────────────── */
exports.createEvent = async (req, res) => {
  try {
    const {
      draftId, title, description, category,
      startDate, startTime, endDate, endTime,
      location, pricing, totalTickets, eventType,
      visibility, streamType, streamURL,
    } = req.body;

    const isFree = parseBooleanFlag(req.body.isFree) || parseBooleanFlag(req.body.isFreeEvent);
    const normalizedVisibility = normalizeVisibility(visibility);

    if (normalizedVisibility === "private" && !hasAccess(req.user, "PRIVATE_EVENTS")) {
      return res.status(403).json({ code: "PLAN_UPGRADE_REQUIRED", message: "Upgrade to Pro to access this feature" });
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

    let event = null;
    let wasDraft = false;

    if (draftId) {
      event = await Event.findOne({ _id: draftId, createdBy: req.user.id, isDraft: true });
      wasDraft = Boolean(event);
    }

    if (!event) {
      event = new Event({ createdBy: req.user.id });
    }

    // Check organizer verification for publishing (isDraft: false)
    // Large events (>50 tickets) require verification to be published
    const isPublishing = !draftId || !event.isDraft;
    if (isPublishing && req.user.role === "organizer") {
      const verificationStatus = await getOrganizerVerificationStatus(req.user._id || req.user.id);
      const totalTickets_num = Number(totalTickets || 0);
      
      if (totalTickets_num > 50 && !verificationStatus.isVerified) {
        return res.status(403).json({
          code: "VERIFICATION_REQUIRED",
          message: "Organizer verification required to publish events with more than 50 tickets",
          verificationStatus: verificationStatus.status,
          rejectionReason: verificationStatus.rejectionReason,
        });
      }
    }

    Object.assign(event, {
      title, description, category,
      startDate, startTime, endDate, endTime,
      location,
      ...(imagePath ? { image: imagePath } : {}),
      pricing: resolvedPricing,
      isFree,
      isFreeEvent: isFree,
      totalTickets,
      eventType,
      visibility: normalizedVisibility,
      status: "approved",
      liveStream: { isLive: false, streamType, streamURL },
      isDraft: false,
      draftStep: 5,
      draftUpdatedAt: null,
    });

    await event.save();

    if (!wasDraft) {
      await User.findByIdAndUpdate(req.user._id || req.user.id, { $inc: { eventCount: 1 } });
    }

    res.status(201).json({ message: "Event created successfully", event });
  } catch (err) {
    console.error("Event creation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ─── Read ────────────────────────────────────────────────────────────────── */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Event.distinct("category", {
      category: { $exists: true, $ne: "" },
      visibility: "public",
      status: "approved",
    });

    const cleaned = categories
      .map((category) => String(category || "").trim())
      .filter((category, index, list) => category && list.indexOf(category) === index);

    const fallback = [
      "Music",
      "Concerts",
      "Comedy",
      "Tech",
      "Business",
      "Startup",
      "Networking",
      "Education",
      "Sports",
      "Gaming",
      "Religious",
      "Fashion",
      "Food",
      "Festival",
      "Conference",
      "Entertainment",
    ];

    return res.json({ categories: cleaned.length ? cleaned.sort() : fallback });
  } catch (err) {
    console.error("GET CATEGORIES ERROR:", err);
    return res.status(500).json({ message: "Unable to load categories" });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const { liveOnly } = req.query;
    const currentUserId = getCurrentUserIdFromRequest(req);
    const liveFilter = liveOnly === "true" ? { "liveStream.isLive": true } : {};
    const filter = buildPublicEventQuery(liveFilter);
    let events = await Event.find(filter).populate(eventPopulateOptions).sort({ createdAt: -1 });

    if (currentUserId) {
      const ownedPending = await Event.find({
        createdBy: currentUserId,
        visibility: "public",
        status: "pending",
        ...liveFilter,
      }).populate(eventPopulateOptions).sort({ createdAt: -1 });

      const seen = new Set(events.map((e) => String(e._id)));
      for (const e of ownedPending) {
        if (!seen.has(String(e._id))) { events.push(e); seen.add(String(e._id)); }
      }
      events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const validEvents = events.filter((e) => e.createdBy && e.visibility !== "private");
    const payload = validEvents.map((e) => buildEventPayload(e, currentUserId)).filter(Boolean);
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

    const visibility = await canViewEvent(event, currentUserId, { allowPrivateLink: true });
    if (!visibility.allowed) return res.status(404).json({ message: "Event not found" });

    const access = currentUserId ? await getEventAccessForUser(event, currentUserId) : null;

    // Owners/admins see all tiers; everyone else sees only enabled tiers
    const isOwnerOrAdmin = access?.isOwner || access?.isAdmin;
    const payloadFn = isOwnerOrAdmin ? buildEventPayloadFull : buildEventPayload;

    res.status(200).json(
      payloadFn(event, currentUserId, {
        eventAccess: access ? toSerializableAccess(access) : null,
      })
    );
  } catch (err) {
    console.error("Error fetching event by ID:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const includeDrafts = parseBooleanFlag(req.query.includeDrafts);
    const onlyDrafts = parseBooleanFlag(req.query.onlyDrafts);

    const filter = { createdBy: userId };
    if (onlyDrafts) {
      filter.isDraft = true;
    } else if (!includeDrafts) {
      filter.isDraft = { $ne: true };
    }

    const events = await Event.find(filter)
      .populate(eventPopulateOptions)
      .sort({ draftUpdatedAt: -1, createdAt: -1 });

    const validEvents = events.filter((e) => e?.createdBy);
    const payload = validEvents
      .map((e) =>
        buildEventPayloadFull(e, userId, {
          eventAccess: toSerializableAccess({
            hasAccess: true,
            isOwner: true,
            isAdmin: Boolean(req.user?.isAdmin),
            isCollaborator: false,
            role: "owner",
            permissions: FULL_PERMISSIONS,
            featureAccess: {
              analytics: hasAccess(req.user, "ANALYTICS_ADVANCED"),
              liveStream: hasAccess(req.user, "LIVE_STREAM"),
              teamMembers: hasAccess(req.user, "TEAM_MEMBERS"),
              refunds: hasAccess(req.user, "REFUNDS"),
            },
          }),
        })
      )
      .filter(Boolean);

    res.status(200).json(payload);
  } catch (error) {
    console.error("GET MY EVENTS ERROR:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/* ─── Buyers / Team / Live / Analytics (unchanged logic) ─────────────────── */
exports.getEventBuyers = async (req, res) => {
  try {
    const { eventId } = req.params;
    const lookup = await authorizeEventAction({
      eventId, user: req.user, permission: "canManageTickets",
      deniedMessage: "You do not have permission to view ticket sales for this event",
    });
    if (lookup.error) return res.status(lookup.error.status).json({ message: lookup.error.message });

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
      eventId, user: req.user, permission: "canModerateLivestream",
      deniedMessage: "You do not have permission to manage this livestream",
    });
    if (lookup.error) return res.status(lookup.error.status).json({ message: lookup.error.message });

    const streamType = lookup.event.liveStream?.streamType || "Camera";
    if (isLive === true && streamType === "Camera") {
      const { getAgoraConfig } = require("../services/agoraService");
      if (!getAgoraConfig().isConfigured) {
        return res.status(503).json({ code: "AGORA_NOT_CONFIGURED", message: "Native live streaming is not configured." });
      }
    }

    lookup.event.liveStream.isLive = isLive;
    await lookup.event.save();
    res.status(200).json({ message: `Stream is now ${isLive ? "LIVE" : "OFF"}`, event: lookup.event });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const lookup = await authorizeEventAction({
      eventId, user: req.user, permission: "canEditEvent",
      deniedMessage: "You do not have permission to edit this event",
    });
    if (lookup.error) return res.status(lookup.error.status).json({ message: lookup.error.message });

    const event = lookup.event;
    const updates = { ...req.body };
    const isFree = parseBooleanFlag(updates.isFree) || parseBooleanFlag(updates.isFreeEvent);
    const normalizedVisibility = normalizeVisibility(updates.visibility || event.visibility);

    if (normalizedVisibility === "private" && !hasAccess(req.user, "PRIVATE_EVENTS")) {
      return res.status(403).json({ code: "PLAN_UPGRADE_REQUIRED", message: "Upgrade to Pro to access this feature" });
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
      if (!isConfigured()) return res.status(503).json({ message: "Image storage is not configured on the server." });
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
        streamURL:  updates.streamURL  || event.liveStream.streamURL,
      };
      delete updates.streamType;
      delete updates.streamURL;
    }

    Object.assign(event, updates);
    await event.save();
    res.status(200).json({ message: "Event updated successfully", event });
  } catch (err) {
    console.error("Update Event Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const lookup = await authorizeEventAction({
      eventId, user: req.user, permission: "canDeleteEvent",
      deniedMessage: "You do not have permission to delete this event",
    });
    if (lookup.error) return res.status(lookup.error.status).json({ message: lookup.error.message });

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
    const visibility = await canViewEvent(event, currentUserId, { allowPrivateLink: true });
    if (!visibility.allowed) return res.status(404).json({ message: "Event not found" });

    event.viewCount += 1;
    recordEventMetrics(event, { views: 1 });
    await event.save();
    res.status(200).json(buildEventPayload(event, currentUserId));
  } catch (err) {
    console.error("Error tracking event view:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.toggleEventLike = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const visibility = await canViewEvent(event, req.user, { allowPrivateLink: true });
    if (!visibility.allowed) return res.status(404).json({ message: "Event not found" });

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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getEventComments = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate({ path: "comments.user", select: "name username profilePic billing" });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const visibility = await canViewEvent(event, getCurrentUserIdFromRequest(req), { allowPrivateLink: true });
    if (!visibility.allowed) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ comments: enrichComments(event.toObject().comments || []), commentCount: event.comments.length });
  } catch (err) {
    console.error("Error fetching comments:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.addEventComment = async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment text is required" });

    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const visibility = await canViewEvent(event, req.user, { allowPrivateLink: true });
    if (!visibility.allowed) return res.status(404).json({ message: "Event not found" });

    event.comments.unshift({ user: req.user.id, text, createdAt: new Date() });
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.trackEventShare = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const currentUserId = getCurrentUserIdFromRequest(req);
    const visibility = await canViewEvent(event, currentUserId, { allowPrivateLink: true });
    if (!visibility.allowed) return res.status(404).json({ message: "Event not found" });

    event.shareCount += 1;
    recordEventMetrics(event, { shares: 1 });
    await event.save();
    res.status(200).json(buildEventPayload(event, getCurrentUserIdFromRequest(req)));
  } catch (err) {
    console.error("Error tracking share:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getEventAnalytics = async (req, res) => {
  try {
    const lookup = await authorizeEventAction({
      eventId: req.params.id, user: req.user, permission: "canAccessAnalytics",
      deniedMessage: "You do not have permission to view analytics for this event",
    });
    if (lookup.error) return res.status(lookup.error.status).json({ message: lookup.error.message });

    const event = await Event.findById(req.params.id).populate(eventPopulateOptions);
    const timeline = buildTimeline(event, 14);
    const totalRevenue = timeline.reduce((sum, p) => sum + p.revenue, 0);
    const totalTimelineSales = timeline.reduce((sum, p) => sum + p.ticketsSold, 0);

    res.status(200).json({
      event: buildEventPayloadFull(event, req.user.id),
      metrics: {
        totalViews:     Number(event.viewCount   || 0),
        ticketsSold:    Number(event.ticketsSold || 0),
        revenue:        totalRevenue,
        likes:          Array.isArray(event.likes)    ? event.likes.length    : 0,
        comments:       Array.isArray(event.comments) ? event.comments.length : 0,
        shares:         Number(event.shareCount || 0),
        conversionRate: event.viewCount > 0
          ? Number(((event.ticketsSold / event.viewCount) * 100).toFixed(1))
          : 0,
      },
      charts: {
        timeline,
        summary: {
          views: timeline.reduce((sum, p) => sum + p.views, 0),
          sales: totalTimelineSales,
        },
      },
    });
  } catch (err) {
    console.error("Error fetching event analytics:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.recordTicketPurchaseMetrics = (event, quantity, revenue) => {
  recordEventMetrics(event, { ticketsSold: Number(quantity || 0), revenue: Number(revenue || 0) });
};