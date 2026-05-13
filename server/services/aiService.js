const axios = require("axios");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo-16k";
// const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

const sanitizeText = (value) => {
  if (value == null) return "";
  const text = String(value);
  return text.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
};

const sanitizeContextObject = (context) => {
  if (!context || typeof context !== "object") return {};
  return {
    event: context.event || null,
    user: context.user || null,
    analytics: context.analytics || null,
  };
};

const buildEventDetails = (event) => {
  if (!event) return "No event details provided.";

  const pricing = Array.isArray(event.pricing)
    ? event.pricing.map((price) => `${price.type}: ${price.price || 0}`).join(" | ")
    : "Not available";

  const ticketsSold = typeof event.ticketsSold === "number" ? event.ticketsSold : "Unknown";
  const viewCount = typeof event.viewCount === "number" ? event.viewCount : "Unknown";
  const shareCount = typeof event.shareCount === "number" ? event.shareCount : "Unknown";

  return [
    `Title: ${event.title || "N/A"}`,
    `Category: ${event.category || "N/A"}`,
    `Type: ${event.eventType || "N/A"}`,
    `Location: ${event.location || "N/A"}`,
    `Dates: ${event.startDate || "N/A"} ${event.startTime || ""}`,
    `Pricing: ${pricing}`,
    `Tickets sold: ${ticketsSold}`,
    `Views: ${viewCount}`,
    `Shares: ${shareCount}`,
    `Description: ${event.description || "None"}`,
  ].join("\n");
};

const buildAnalyticsSummary = (analytics, event) => {
  const pieces = [];

  if (analytics && typeof analytics === "object") {
    if (analytics.attendance) {
      pieces.push(`Attendance indicator: ${sanitizeText(analytics.attendance)}`);
    }
    if (analytics.engagement) {
      pieces.push(`Engagement notes: ${sanitizeText(analytics.engagement)}`);
    }
    if (analytics.revenue) {
      pieces.push(`Revenue insight: ${sanitizeText(analytics.revenue)}`);
    }
    if (analytics.topChannels) {
      pieces.push(`Top channels: ${sanitizeText(analytics.topChannels)}`);
    }
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
  const profile = [
    `Name: ${user.name || "N/A"}`,
    `Role: ${user.role || "N/A"}`,
    `Location: ${user.location || "N/A"}`,
    `Plan: ${user.plan || "Standard"}`,
    `Favorite categories: ${Array.isArray(favoriteTags) ? favoriteTags.join(", ") : sanitizeText(String(favoriteTags))}`,
    `Favorites count: ${Array.isArray(user.favorites) ? user.favorites.length : "Unknown"}`,
  ];

  if (user.email) {
    profile.push(`Email: ${user.email}`);
  }

  return profile.join("\n");
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
    pricing: Array.isArray(eventContext.pricing) ? eventContext.pricing.map((item) => ({ type: sanitizeText(item.type), price: Number(item.price) || 0 })) : [],
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
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          ticketsSold: { $sum: "$quantity" },
          revenue: { $sum: "$amountPaid" },
        },
      },
    ]),
    userId ? Ticket.find({ event: eventId, buyer: userId }).lean() : [],
  ]);

  const metrics = ticketMetrics[0] || { orders: 0, ticketsSold: 0, revenue: 0 };

  return {
    totalOrders: metrics.orders,
    ticketsSold: metrics.ticketsSold,
    revenue: metrics.revenue,
    userTickets: Array.isArray(userTickets) ? userTickets.map((ticket) => ({
      quantity: ticket.quantity,
      price: ticket.price,
      ticketType: ticket.ticketType,
      purchasedAt: ticket.purchasedAt,
      paymentStatus: ticket.paymentStatus,
    })) : [],
  };
};

// ─── REPLACE ONLY THESE FUNCTIONS in your aiService.js ───────────────────────
// Everything else (imports, sanitize helpers, resolveEvent, resolveUser,
// loadTicketContext, buildEventDetails, buildAnalyticsSummary, buildUserSummary,
// buildContextPayload, generateEventFromPrompt) stays exactly the same.
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Load upcoming published events for context (user concierge) ────────────
const loadAvailableEvents = async () => {
  try {
    const events = await Event.find(
      { status: "published" },
      "title category location startDate startTime pricing isFree tags description"
    )
      .sort({ startDate: 1 })
      .limit(20)
      .lean();

    return events.map((e) => {
      const price = e.isFree
        ? "Free"
        : e.pricing?.[0]?.price
        ? `₦${e.pricing[0].price.toLocaleString()}`
        : "Paid";

      return {
        id: e._id,
        title: e.title,
        category: e.category || "General",
        location: e.location || "TBA",
        date: e.startDate
          ? new Date(e.startDate).toDateString()
          : "Date TBA",
        time: e.startTime || "TBA",
        price,
        tags: Array.isArray(e.tags) ? e.tags.join(", ") : "",
        description: e.description
          ? e.description.slice(0, 120) + (e.description.length > 120 ? "…" : "")
          : "",
      };
    });
  } catch {
    return [];
  }
};

// ── 2. System prompts — knowledgeable, not restrictive ───────────────────────
const getSystemPrompt = (role) => {
  const base = [
    "You are TickiAI, the intelligent assistant built into TickiSpot — a Nigerian event ticketing and discovery platform.",
    "You are friendly, direct, and genuinely helpful.",
    "You have broad knowledge about events, entertainment, event planning, ticketing, marketing, social media, pricing strategy, crowd management, logistics, Nigerian culture, and anything else relevant to running or attending events.",
    "When platform data (events, user profile, analytics, tickets) is provided in the context, use it to give specific, accurate answers.",
    "When no platform data is available for a question, answer from your general knowledge — do NOT say 'I don't have enough context' for questions you can answer from knowledge.",
    "Keep answers concise and actionable. Use bullet points for lists. Avoid lengthy preambles.",
    "If you genuinely cannot answer something (e.g. real-time data you don't have), say so briefly and suggest what the user can do instead.",
    "Never make up specific event details, prices, or dates that weren't provided in the context.",
  ].join(" ");

  if (role === "organizer") {
    return [
      base,
      "",
      "You are currently in ORGANIZER mode.",
      "Help organizers with: event creation and planning, pricing strategy (Regular/VIP/VVIP tiers), marketing copy and social media content, audience targeting, ticket sales optimization, event logistics, vendor management, post-event analytics interpretation, growing their audience on TickiSpot, and best practices for Nigerian events.",
      "Be proactive — if someone asks a vague question, give a complete answer and offer follow-up suggestions.",
    ].join(" ");
  }

  return [
    base,
    "",
    "You are currently in USER/CONCIERGE mode.",
    "Help attendees with: discovering events on TickiSpot, choosing the right ticket tier, what to expect at events, transportation and logistics tips, what to wear or bring, how Nigerian events typically work, refund and ticket policies (general best practice, since platform-specific policies depend on the organizer), group bookings, and general event etiquette.",
    "When platform events are listed in context, recommend specific ones that match the user's interests.",
    "Be warm, enthusiastic, and helpful — like a knowledgeable friend who knows the Lagos event scene.",
  ].join(" ");
};

// ── 3. Build the user-facing prompt with context ─────────────────────────────
const buildUserPrompt = (message, context, role) => {
  const parts = [`User: ${sanitizeText(message)}`];

  // ── Specific event context (organizer viewing their event dashboard, etc.) ──
  if (context.event) {
    parts.push("━━ Current Event ━━");
    parts.push(buildEventDetails(context.event));
  }

  // ── Ticket metrics ────────────────────────────────────────────────────────
  if (context.tickets) {
    parts.push("━━ Ticket Data ━━");
    parts.push(
      `Orders: ${context.tickets.totalOrders} | Sold: ${context.tickets.ticketsSold} | Revenue: ₦${(context.tickets.revenue || 0).toLocaleString()}`
    );
    if (context.tickets.userTickets?.length) {
      parts.push(
        `User has purchased ${context.tickets.userTickets.length} ticket(s) for this event.`
      );
    }
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  if (context.analytics) {
    parts.push("━━ Analytics ━━");
    parts.push(buildAnalyticsSummary(context.analytics, context.event));
  }

  // ── User profile ──────────────────────────────────────────────────────────
  if (context.user) {
    parts.push("━━ User Profile ━━");
    parts.push(buildUserSummary(context.user));
  }

  // ── Available events on platform (user concierge role) ───────────────────
  if (role === "user" && context.availableEvents?.length) {
    parts.push("━━ Events Currently on TickiSpot ━━");
    parts.push(
      context.availableEvents
        .map(
          (e, i) =>
            `${i + 1}. ${e.title} (${e.category}) — ${e.location} | ${e.date} ${e.time} | ${e.price}${e.tags ? ` | Tags: ${e.tags}` : ""}${e.description ? `\n   ${e.description}` : ""}`
        )
        .join("\n")
    );
  }

  // ── No context at all: just answer from knowledge ────────────────────────
  if (
    !context.event &&
    !context.user &&
    !context.availableEvents?.length
  ) {
    parts.push(
      role === "organizer"
        ? "No specific event data loaded. Answer from your knowledge of event planning, ticketing, and marketing best practices."
        : "No specific platform data loaded. Answer from your knowledge of events, entertainment, and what's generally useful for event attendees in Nigeria."
    );
  }

  return parts.join("\n\n");
};

// ── 4. Updated buildContextPayload (pass role so we conditionally load events) 
const buildContextPayload = async ({ event, user, analytics }, role = "user") => {
  const resolvedEvent = await resolveEvent(event);
  const resolvedUser = await resolveUser(user);
  const ticketContext =
    resolvedEvent?._id
      ? await loadTicketContext(resolvedEvent._id, resolvedUser?._id)
      : null;

  // Only fetch platform events for the user/concierge role
  const availableEvents =
    role === "user" ? await loadAvailableEvents() : [];

  return {
    event: resolvedEvent,
    user: resolvedUser,
    analytics: analytics || resolvedEvent?.analytics || null,
    tickets: ticketContext,
    availableEvents,
  };
};

// ── 5. Main createAIResponse — updated to pass role through ──────────────────
const createAIResponse = async ({ role, message, context = {} }) => {
  if (!GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY environment variable.");
  }

  const safeRole = role === "organizer" ? "organizer" : "user";
  const safeMessage = sanitizeText(message);
  const cleanedContext = sanitizeContextObject(context);

  // Resolve DB context with role awareness
  const contextPayload = await buildContextPayload(cleanedContext, safeRole);

  const messages = [
    { role: "system", content: getSystemPrompt(safeRole) },
    { role: "user", content: buildUserPrompt(safeMessage, contextPayload, safeRole) },
  ];

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 700,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const answer = String(
      response.data?.choices?.[0]?.message?.content || ""
    ).trim();

    return {
      role: safeRole,
      answer,
      model: GROQ_MODEL,
      context: {
        event: contextPayload.event
          ? { id: contextPayload.event._id || null, title: contextPayload.event.title }
          : null,
        user: contextPayload.user
          ? {
              id: contextPayload.user._id || null,
              name: contextPayload.user.name || null,
              role: contextPayload.user.role || null,
            }
          : null,
        analytics: contextPayload.analytics
          ? {
              summary: sanitizeText(
                buildAnalyticsSummary(contextPayload.analytics, contextPayload.event)
              ),
            }
          : null,
      },
    };
  } catch (error) {
    const messageOverride =
      error.response?.data?.error?.message ||
      error.message ||
      "AI service unavailable.";
    const statusCode = error.response?.status || 502;
    const err = new Error(`AI request failed: ${messageOverride}`);
    err.status = statusCode;
    throw err;
  }
};


const generateEventFromPrompt = async ({ prompt }) => {
  if (!GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY environment variable.");
  }

  const safePrompt = sanitizeText(prompt);
  if (!safePrompt) {
    throw new Error("Event prompt is required.");
  }

  if (safePrompt.length > 500) {
    throw new Error("Event prompt must be 500 characters or fewer.");
  }

  const systemPrompt = [
    "You are an expert event organizer AI assistant.",
    "Your task is to extract and infer event details from user descriptions.",
    "Return ONLY a valid JSON object with no markdown, code blocks, or extra text.",
    "Use Nigerian Naira (₦) for prices if not specified otherwise.",
    "For dates, use YYYY-MM-DD format. If time is not specified, default to 14:00.",
    "Infer sensible defaults for missing fields based on the category and context.",
    "Generate an engaging description that sells the event.",
    "Tags should be lowercase, hyphenated, and 3-5 relevant tags.",
  ].join(" ");

  const userPrompt = [
    `Convert this event description into structured JSON format:`,
    `"${safePrompt}"`,
    ``,
    `Return a JSON object with ONLY these fields (no additional fields):`,
    `{`,
    `  "title": "Event name (required, string)",`,
    `  "description": "Engaging event description (string)",`,
    `  "category": "Event category like Tech, Music, Sports, Business, etc (string)",`,
    `  "location": "Event location or 'Virtual' (string)",`,
    `  "capacity": "Expected attendee count (number, default 100)",`,
    `  "ticketPrice": "Price in Nigerian Naira (number, 0 for free)",`,
    `  "tags": "Array of 3-5 lowercase tags (array of strings)",`,
    `  "date": "Event date in YYYY-MM-DD format (string)",`,
    `  "time": "Event time in HH:MM format, 24-hour (string, default 14:00)"`,
    `}`,
  ].join("\n");

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await axios.post(
      GROQ_URL,
  {
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 700,
  },
  {
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
  }
);

    //   OPENAI_URL,
    //   {
    //     model: OPENAI_MODEL,
    //     messages,
    //     temperature: 0.7,
    //     max_tokens: 500,
    //   },
    //   {
    //     headers: {
    //       Authorization: `Bearer ${OPENAI_API_KEY}`,
    //       "Content-Type": "application/json",
    //     },
    //     timeout: 30000,
    //   },
    // );

    const rawText = String(response.data?.choices?.[0]?.message?.content || "").trim();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from AI response.");
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const eventData = {
      title: sanitizeText(parsed.title || "New Event"),
      description: sanitizeText(parsed.description || ""),
      category: sanitizeText(parsed.category || "Other"),
      location: sanitizeText(parsed.location || ""),
      capacity: Math.max(0, parseInt(parsed.capacity, 10) || 100),
      ticketPrice: Math.max(0, parseFloat(parsed.ticketPrice) || 0),
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.map((tag) => sanitizeText(String(tag).toLowerCase())).filter(Boolean)
        : [],
      date: sanitizeText(parsed.date || ""),
      time: sanitizeText(parsed.time || "14:00"),
    };

   const transformedEvent = {
  title: eventData.title,
  description: eventData.description,
  category: eventData.category,

  location: eventData.location,

  startDate: eventData.date ? new Date(eventData.date) : null,
  startTime: eventData.time || "14:00",

  totalTickets: eventData.capacity || 100,

  pricing: [
    {
      type: eventData.ticketPrice > 0 ? "Regular" : "Free",
      price: eventData.ticketPrice || 0,
    },
  ],

  isFree: eventData.ticketPrice === 0,
  isFreeEvent: eventData.ticketPrice === 0,

  eventType:
    eventData.location?.toLowerCase() === "virtual"
      ? "Virtual"
      : "In-person",

  tags: eventData.tags || [],
};

return { success: true, event: transformedEvent };
  } catch (error) {
    const messageOverride = error.response?.data?.error?.message || error.message || "Event generation failed.";
    const statusCode = error.response?.status || 502;
    const err = new Error(`Event generation error: ${messageOverride}`);
    err.status = statusCode;
    throw err;
  }
};

module.exports = { createAIResponse, generateEventFromPrompt };
