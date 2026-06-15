const axios = require("axios");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const sanitizeText = (value) => {
  if (value == null) return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
};

const parseBooleanFlag = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
};

const sanitizeContextObject = (context) => {
  if (!context || typeof context !== "object") return {};
  return { event: context.event || null, user: context.user || null, analytics: context.analytics || null };
};

const buildEventDetails = (event) => {
  if (!event) return "No event details provided.";
  const pricing = Array.isArray(event.pricing)
    ? event.pricing.map((p) => `${p.type}: ${p.price || 0}`).join(" | ")
    : "Not available";
  return [
    `Title: ${event.title || "N/A"}`,
    `Category: ${event.category || "N/A"}`,
    `Type: ${event.eventType || "N/A"}`,
    `Location: ${event.location || "N/A"}`,
    `Dates: ${event.startDate || "N/A"} ${event.startTime || ""}`,
    `Pricing: ${pricing}`,
    `Tickets sold: ${event.ticketsSold ?? "Unknown"}`,
    `Views: ${event.viewCount ?? "Unknown"}`,
    `Shares: ${event.shareCount ?? "Unknown"}`,
    `Description: ${event.description || "None"}`,
  ].join("\n");
};

const buildAnalyticsSummary = (analytics, event) => {
  const pieces = [];
  if (analytics && typeof analytics === "object") {
    if (analytics.attendance) pieces.push(`Attendance indicator: ${sanitizeText(analytics.attendance)}`);
    if (analytics.engagement) pieces.push(`Engagement notes: ${sanitizeText(analytics.engagement)}`);
    if (analytics.revenue) pieces.push(`Revenue insight: ${sanitizeText(analytics.revenue)}`);
    if (analytics.topChannels) pieces.push(`Top channels: ${sanitizeText(analytics.topChannels)}`);
  }
  if (event?.analytics?.daily?.length) {
    const latest = event.analytics.daily[event.analytics.daily.length - 1];
    pieces.push(`Latest daily metrics: views ${latest.views || 0}, likes ${latest.likes || 0}, shares ${latest.shares || 0}, tickets ${latest.ticketsSold || 0}`);
  }
  return pieces.length ? pieces.join("\n") : "No analytics summary available.";
};

const buildUserSummary = (user) => {
  if (!user) return "No user profile details available.";
  const preferences = user.preferences || user.profilePreferences || {};
  const favoriteTags = preferences.favoriteCategories || preferences.interests || user.favorites || [];
  return [
    `Name: ${user.name || "N/A"}`,
    `Role: ${user.role || "N/A"}`,
    `Location: ${user.location || "N/A"}`,
    `Plan: ${user.plan || "Standard"}`,
    `Favorite categories: ${Array.isArray(favoriteTags) ? favoriteTags.join(", ") : sanitizeText(String(favoriteTags))}`,
    `Favorites count: ${Array.isArray(user.favorites) ? user.favorites.length : "Unknown"}`,
    ...(user.email ? [`Email: ${user.email}`] : []),
  ].join("\n");
};

const resolveEvent = async (eventContext) => {
  if (!eventContext) return null;
  const eventId = sanitizeText(eventContext._id || eventContext.id || eventContext.eventId);
  if (eventId) {
    const eventFromDb = await Event.findById(eventId).populate("createdBy", "name username role").lean();
    if (eventFromDb) return eventFromDb;
  }
  return {
    title: sanitizeText(eventContext.title),
    description: sanitizeText(eventContext.description),
    category: sanitizeText(eventContext.category),
    eventType: sanitizeText(eventContext.eventType),
    location: sanitizeText(eventContext.location),
    startDate: sanitizeText(eventContext.startDate),
    startTime: sanitizeText(eventContext.startTime),
    pricing: Array.isArray(eventContext.pricing)
      ? eventContext.pricing.map((item) => ({ type: sanitizeText(item.type), price: Number(item.price) || 0 }))
      : [],
    ticketsSold: Number(eventContext.ticketsSold) || 0,
    viewCount: Number(eventContext.viewCount) || 0,
    shareCount: Number(eventContext.shareCount) || 0,
    analytics: eventContext.analytics || null,
  };
};

const resolveUser = async (userContext) => {
  if (!userContext) return null;
  const userId = sanitizeText(userContext._id || userContext.id);
  if (userId) {
    const userFromDb = await User.findById(userId).lean();
    if (userFromDb) return userFromDb;
  }
  if (userContext.email) {
    const userFromDb = await User.findOne({ email: sanitizeText(userContext.email).toLowerCase() }).lean();
    if (userFromDb) return userFromDb;
  }
  return {
    name: sanitizeText(userContext.name),
    email: sanitizeText(userContext.email),
    role: sanitizeText(userContext.role),
    location: sanitizeText(userContext.location),
    plan: sanitizeText(userContext.plan),
    favorites: Array.isArray(userContext.favorites) ? userContext.favorites : [],
    preferences: userContext.preferences || {},
  };
};

const loadTicketContext = async (eventId, userId) => {
  if (!eventId) return null;
  const [ticketMetrics, userTickets] = await Promise.all([
    Ticket.aggregate([
      { $match: { event: mongoose.isValidObjectId(eventId) ? mongoose.Types.ObjectId(eventId) : null } },
      { $group: { _id: null, orders: { $sum: 1 }, ticketsSold: { $sum: "$quantity" }, revenue: { $sum: "$amountPaid" } } },
    ]),
    userId ? Ticket.find({ event: eventId, buyer: userId }).lean() : [],
  ]);
  const metrics = ticketMetrics[0] || { orders: 0, ticketsSold: 0, revenue: 0 };
  return {
    totalOrders: metrics.orders,
    ticketsSold: metrics.ticketsSold,
    revenue: metrics.revenue,
    userTickets: Array.isArray(userTickets)
      ? userTickets.map((t) => ({ quantity: t.quantity, price: t.price, ticketType: t.ticketType, purchasedAt: t.purchasedAt, paymentStatus: t.paymentStatus }))
      : [],
  };
};

const loadAvailableEvents = async () => {
  try {
    const events = await Event.find(
      { status: "published" },
      "title category location startDate startTime pricing isFree tags description"
    ).sort({ startDate: 1 }).limit(20).lean();
    return events.map((e) => ({
      id: e._id,
      title: e.title,
      category: e.category || "General",
      location: e.location || "TBA",
      date: e.startDate ? new Date(e.startDate).toDateString() : "Date TBA",
      time: e.startTime || "TBA",
      price: e.isFree ? "Free" : e.pricing?.[0]?.price ? `₦${e.pricing[0].price.toLocaleString()}` : "Paid",
      tags: Array.isArray(e.tags) ? e.tags.join(", ") : "",
      description: e.description ? e.description.slice(0, 120) + (e.description.length > 120 ? "…" : "") : "",
    }));
  } catch { return []; }
};

const getSystemPrompt = (role) => {
  const base = [
    "You are TickiAI, the intelligent assistant built into TickiSpot — a Nigerian event ticketing and discovery platform.",
    "You are friendly, direct, and genuinely helpful.",
    "You have broad knowledge about events, entertainment, event planning, ticketing, marketing, social media, pricing strategy, crowd management, logistics, Nigerian culture, and anything else relevant to running or attending events.",
    "When platform data (events, user profile, analytics, tickets) is provided in the context, use it to give specific, accurate answers.",
    "When no platform data is available for a question, answer from your general knowledge — do NOT say 'I don't have enough context' for questions you can answer from knowledge.",
    "Keep answers concise and actionable. Use bullet points for lists. Avoid lengthy preambles.",
    "If you genuinely cannot answer something, say so briefly and suggest what the user can do instead.",
    "Never make up specific event details, prices, or dates that weren't provided in the context.",
  ].join(" ");
  if (role === "organizer") {
    return base + " You are currently in ORGANIZER mode. Help organizers with: event creation and planning, pricing strategy (Regular/VIP/VVIP tiers), marketing copy and social media content, audience targeting, ticket sales optimization, event logistics, vendor management, post-event analytics interpretation, growing their audience on TickiSpot, and best practices for Nigerian events. Be proactive — if someone asks a vague question, give a complete answer and offer follow-up suggestions.";
  }
  return base + " You are currently in USER/CONCIERGE mode. Help attendees with: discovering events on TickiSpot, choosing the right ticket tier, what to expect at events, transportation and logistics tips, what to wear or bring, how Nigerian events typically work, refund and ticket policies, group bookings, and general event etiquette. When platform events are listed in context, recommend specific ones that match the user's interests. Be warm, enthusiastic, and helpful.";
};

const buildUserPrompt = (message, context, role) => {
  const parts = [`User: ${sanitizeText(message)}`];
  if (context.event) { parts.push("━━ Current Event ━━"); parts.push(buildEventDetails(context.event)); }
  if (context.tickets) {
    parts.push("━━ Ticket Data ━━");
    parts.push(`Orders: ${context.tickets.totalOrders} | Sold: ${context.tickets.ticketsSold} | Revenue: ₦${(context.tickets.revenue || 0).toLocaleString()}`);
    if (context.tickets.userTickets?.length) parts.push(`User has purchased ${context.tickets.userTickets.length} ticket(s) for this event.`);
  }
  if (context.analytics) { parts.push("━━ Analytics ━━"); parts.push(buildAnalyticsSummary(context.analytics, context.event)); }
  if (context.user) { parts.push("━━ User Profile ━━"); parts.push(buildUserSummary(context.user)); }
  if (role === "user" && context.availableEvents?.length) {
    parts.push("━━ Events Currently on TickiSpot ━━");
    parts.push(context.availableEvents.map((e, i) => `${i + 1}. ${e.title} (${e.category}) — ${e.location} | ${e.date} ${e.time} | ${e.price}${e.tags ? ` | Tags: ${e.tags}` : ""}${e.description ? `\n   ${e.description}` : ""}`).join("\n"));
  }
  if (!context.event && !context.user && !context.availableEvents?.length) {
    parts.push(role === "organizer" ? "No specific event data loaded. Answer from your knowledge of event planning, ticketing, and marketing best practices." : "No specific platform data loaded. Answer from your knowledge of events, entertainment, and what's generally useful for event attendees in Nigeria.");
  }
  return parts.join("\n\n");
};

const buildContextPayload = async ({ event, user, analytics }, role = "user") => {
  const resolvedEvent = await resolveEvent(event);
  const resolvedUser = await resolveUser(user);
  const ticketContext = resolvedEvent?._id ? await loadTicketContext(resolvedEvent._id, resolvedUser?._id) : null;
  const availableEvents = role === "user" ? await loadAvailableEvents() : [];
  return { event: resolvedEvent, user: resolvedUser, analytics: analytics || resolvedEvent?.analytics || null, tickets: ticketContext, availableEvents };
};

const createAIResponse = async ({ role, message, context = {} }) => {
  if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY environment variable.");
  const safeRole = role === "organizer" ? "organizer" : "user";
  const safeMessage = sanitizeText(message);
  const cleanedContext = sanitizeContextObject(context);
  const contextPayload = await buildContextPayload(cleanedContext, safeRole);
  const messages = [
    { role: "system", content: getSystemPrompt(safeRole) },
    { role: "user", content: buildUserPrompt(safeMessage, contextPayload, safeRole) },
  ];
  try {
    const response = await axios.post(GROQ_URL, { model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 700 }, { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } });
    const answer = String(response.data?.choices?.[0]?.message?.content || "").trim();
    return {
      role: safeRole, answer, model: GROQ_MODEL,
      context: {
        event: contextPayload.event ? { id: contextPayload.event._id || null, title: contextPayload.event.title } : null,
        user: contextPayload.user ? { id: contextPayload.user._id || null, name: contextPayload.user.name || null, role: contextPayload.user.role || null } : null,
        analytics: contextPayload.analytics ? { summary: sanitizeText(buildAnalyticsSummary(contextPayload.analytics, contextPayload.event)) } : null,
      },
    };
  } catch (error) {
    const msg = error.response?.data?.error?.message || error.message || "AI service unavailable.";
    const err = new Error(`AI request failed: ${msg}`);
    err.status = error.response?.status || 502;
    throw err;
  }
};

/* ─── Enhanced generateEventFromPrompt ───────────────────────────────────────
 *
 * Returns a fully-hydrated event object covering ALL CreateEvent wizard steps:
 *   Step 1: title, description, category, location, eventType, visibility,
 *           startDate, startTime, endDate, endTime
 *   Step 2: imageSearchQuery (for cover image fetch via Unsplash/Picsum)
 *   Step 3: totalTickets, pricing (flexible tiers), isFree
 *   Step 4: streamType, streamURL
 * ─────────────────────────────────────────────────────────────────────────── */
const generateEventFromPrompt = async ({ prompt }) => {
  if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY environment variable.");

  const safePrompt = sanitizeText(prompt);
  if (!safePrompt) throw new Error("Event prompt is required.");
  if (safePrompt.length > 500) throw new Error("Event prompt must be 500 characters or fewer.");

  const systemPrompt = [
    "You are an expert event organizer AI assistant for TickiSpot, a Nigerian event platform.",
    "Extract and infer COMPLETE event details from user descriptions.",
    "Return ONLY a valid JSON object — no markdown, no code blocks, no commentary before or after.",
    "Use Nigerian Naira (₦) for prices unless another currency is specified.",
    "Dates must be YYYY-MM-DD format. Times must be HH:MM 24-hour format. Default time: 14:00.",
    "Generate an engaging, vivid description (2-3 sentences) that sells the event.",
    "For ticket pricing: choose tier names and structures that fit the event type and category.",
    "For conferences, use Student/Professional/VIP or similar; for music events, use Regular/VIP/VVIP, Early Bird, Backstage, or Premium; for festivals, use General Admission, VIP, and Weekend Pass when appropriate.",
    "Return a pricing array when possible. Each tier should include type, price, label, description, benefits, maxPerOrder, and any relevant sale dates or availability details.",
    "Set vipPrice/vvipPrice to 0 only if the user explicitly mentions only one paid ticket tier.",
    "imageSearchQuery: a Unsplash/Pexels search string (5-8 words, NO brand names) that would return a great cover photo for this event. Be vivid and specific.",
    "tags: 3-5 lowercase hyphenated tags.",
  ].join(" ");

  const pricingSchema = JSON.stringify({
    type: "string",
    price: "number",
    label: "string",
    description: "string",
    benefits: "string",
    isRefundable: "boolean",
    isTransferable: "boolean",
    groupSize: "number",
    availableQuantity: "number",
    saleStartDate: "YYYY-MM-DD or empty string",
    saleEndDate: "YYYY-MM-DD or empty string",
    priceIncreaseDate: "YYYY-MM-DD or empty string",
    maxPerOrder: "number",
  });

  const userPrompt = `Convert this event description into a complete JSON object:
"${safePrompt}"

Return ONLY this JSON structure (all fields required):
{
  "title": "string — event name",
  "description": "string — 2-3 sentence engaging description",
  "category": "string — one of: Tech, Music, Business, Sports, Arts, Food & Drink, Health, Education, Fashion, Comedy, Fitness, Networking, Film, Religious, Charity, Other",
  "eventType": "string — one of: In-person, Virtual, Hybrid",
  "location": "string — venue/city or 'Online' for virtual",
  "visibility": "string — public or private (default: public)",
  "startDate": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endDate": "YYYY-MM-DD (same as startDate if single-day)",
  "endTime": "HH:MM (2 hours after startTime if not specified)",
  "totalTickets": "number — attendee capacity",
  "pricing": [${pricingSchema}],
  "regularPrice": "number — Regular ticket price in Naira (0 for free)",
  "vipPrice": "number — VIP ticket price in Naira (0 if no VIP)",
  "vvipPrice": "number — VVIP ticket price in Naira (0 if no VVIP)",
  "isFree": "boolean",
  "streamType": "string — Camera, YouTube, Facebook, or Custom (Camera for in-person)",
  "streamURL": "string — URL if streamType is not Camera, else empty string",
  "imageSearchQuery": "string — vivid 5-8 word Unsplash search query for a great cover photo",
  "tags": ["array", "of", "tags"]
}`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await axios.post(
      GROQ_URL,
      { model: GROQ_MODEL, messages, temperature: 0.65, max_tokens: 800 },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );

    const rawText = String(response.data?.choices?.[0]?.message?.content || "").trim();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not extract JSON from AI response.");
      parsed = JSON.parse(jsonMatch[0]);
    }

    // ── Normalize all fields ────────────────────────────────────────────────
    const normalizePricingDate = (value) => {
      if (!value) return null;
      const d = new Date(String(value));
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    };

    const eventType = (() => {
      const t = sanitizeText(parsed.eventType || "").toLowerCase();
      if (t.includes("virtual") || t.includes("online")) return "Virtual";
      if (t.includes("hybrid")) return "Hybrid";
      return "In-person";
    })();

    const pricing = Array.isArray(parsed.pricing) && parsed.pricing.length
      ? parsed.pricing.map((tier) => {
          const priceValue = Math.max(0, parseFloat(tier?.price ?? tier?.amount ?? 0) || 0);
          return {
            type:              sanitizeText(tier?.type || tier?.name || tier?.label || ""),
            price:             priceValue > 0 ? String(priceValue) : "",
            isEnabled:         tier?.isEnabled !== false,
            isFree:            parseBooleanFlag(tier?.isFree) || priceValue === 0,
            label:             sanitizeText(tier?.label || ""),
            description:       sanitizeText(tier?.description || ""),
            benefits:          sanitizeText(tier?.benefits || ""),
            isRefundable:      tier?.isRefundable !== false,
            isTransferable:    tier?.isTransferable !== false,
            groupSize:         Number(tier?.groupSize || 1),
            availableQuantity: Number(tier?.availableQuantity || 0),
            saleStartDate:     normalizePricingDate(tier?.saleStartDate),
            saleEndDate:       normalizePricingDate(tier?.saleEndDate),
            priceIncreaseDate: normalizePricingDate(tier?.priceIncreaseDate),
            maxPerOrder:       Number(tier?.maxPerOrder || 0),
          };
        })
      : [
          { type: "Regular", price: Math.max(0, parseFloat(parsed.regularPrice ?? parsed.ticketPrice ?? 0) || 0) > 0 ? String(Math.max(0, parseFloat(parsed.regularPrice ?? parsed.ticketPrice ?? 0) || 0)) : "" },
          { type: "VIP",     price: Math.max(0, parseFloat(parsed.vipPrice ?? 0) || 0) > 0 ? String(Math.max(0, parseFloat(parsed.vipPrice ?? 0) || 0)) : "" },
          { type: "VVIP",    price: Math.max(0, parseFloat(parsed.vvipPrice ?? 0) || 0) > 0 ? String(Math.max(0, parseFloat(parsed.vvipPrice ?? 0) || 0)) : "" },
        ];

    const regularPrice = Number(pricing[0]?.price || 0);
    const vipPrice     = Number(pricing[1]?.price || 0);
    const vvipPrice    = Number(pricing[2]?.price || 0);
    const isFree       = parsed.isFree === true || (regularPrice === 0 && vipPrice === 0 && vvipPrice === 0);

    const startDate = sanitizeText(parsed.startDate || "");
    const startTime = sanitizeText(parsed.startTime || "14:00");

    // Compute a sensible endTime default (+2 hours) when not provided
    let endTime = sanitizeText(parsed.endTime || "");
    if (!endTime && startTime) {
      try {
        const [h, m] = startTime.split(":").map(Number);
        const end = new Date(0, 0, 0, h + 2, m);
        endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
      } catch { endTime = "16:00"; }
    }

    const transformedEvent = {
      // ── Step 1 fields ─────────────────────────────────────────────────────
      title:       sanitizeText(parsed.title || "New Event"),
      description: sanitizeText(parsed.description || ""),
      category:    sanitizeText(parsed.category || "Other"),
      eventType,
      location:    eventType === "Virtual" ? "" : sanitizeText(parsed.location || ""),
      visibility:  ["public", "private"].includes(parsed.visibility) ? parsed.visibility : "public",
      startDate,
      startTime,
      endDate:     sanitizeText(parsed.endDate || parsed.startDate || ""),
      endTime,

      // ── Step 2 fields ─────────────────────────────────────────────────────
      imageSearchQuery: sanitizeText(parsed.imageSearchQuery || `${parsed.title || ""} event`),

      // ── Step 3 fields ─────────────────────────────────────────────────────
      totalTickets: Math.max(1, parseInt(parsed.totalTickets ?? parsed.capacity ?? 100, 10) || 100),
      pricing,
      isFree,
      isFreeEvent: isFree,

      // ── Step 4 fields ─────────────────────────────────────────────────────
      streamType: sanitizeText(parsed.streamType || "Camera"),
      streamURL:  sanitizeText(parsed.streamURL || ""),

      // ── Extras ────────────────────────────────────────────────────────────
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((t) => sanitizeText(String(t).toLowerCase())).filter(Boolean)
        : [],
    };

    return { success: true, event: transformedEvent };
  } catch (error) {
    const msg = error.response?.data?.error?.message || error.message || "Event generation failed.";
    const err = new Error(`Event generation error: ${msg}`);
    err.status = error.response?.status || 502;
    throw err;
  }
};

/* ─── generateEventImage ─────────────────────────────────────────────────────
 *
 * Fetches a relevant cover image from Unsplash (free, no key needed for basic
 * usage) based on the event title + description.
 * Returns: { imageUrl, photographer, photographerUrl, downloadUrl }
 * ─────────────────────────────────────────────────────────────────────────── */
const generateEventImage = async ({ title, description, searchQuery }) => {
  const query = sanitizeText(
    searchQuery || `${title || ""} ${description || ""}`.slice(0, 80)
  );

  if (!query) throw new Error("title or searchQuery is required for image generation.");

  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

  if (!UNSPLASH_ACCESS_KEY) {
    return {
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(query)}/1200/600`,
      photographer: null,
      photographerUrl: null,
      downloadUrl: null,
      source: "picsum",
    };
  }

  try {
    const response = await axios.get("https://api.unsplash.com/search/photos", {
      params: { query, per_page: 5, orientation: "landscape", order_by: "relevance" },
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });

    const photos = response.data?.results || [];
    if (!photos.length) {
      return {
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(query)}/1200/600`,
        photographer: null, photographerUrl: null, downloadUrl: null,
        source: "picsum_fallback",
      };
    }

    const photo = photos[0];
    return {
      imageUrl: photo.urls?.regular || photo.urls?.full,
      smallUrl: photo.urls?.small,
      photographer: photo.user?.name || null,
      photographerUrl: photo.user?.links?.html || null,
      downloadUrl: photo.links?.download_location || null,
      source: "unsplash",
    };
  } catch (error) {
    return {
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(query)}/1200/600`,
      photographer: null, photographerUrl: null, downloadUrl: null,
      source: "picsum_error_fallback",
    };
  }
};

module.exports = { createAIResponse, generateEventFromPrompt, generateEventImage };