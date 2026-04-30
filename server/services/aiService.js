const axios = require("axios");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo-16k";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

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

const getSystemPrompt = (role) => {
  if (role === "organizer") {
    return [
      "You are TickiAI, a smart event business assistant for TickiSpot organizers.",
      "Provide concise, actionable recommendations for event creation, pricing strategy, marketing content, and performance analysis.",
      "Use context data when available, and keep answers professional, direct, and easy to act on.",
      "If you cannot answer with the information provided, ask for the missing details clearly.",
    ].join(" ");
  }

  return [
    "You are TickiAI, an event concierge for users on TickiSpot.",
    "Help users discover events, answer event questions, recommend tickets, and guide them in friendly, direct language.",
    "Use event and user context when available, and keep the answer simple and upbeat.",
    "If you need more information to help, ask the user a clear follow-up question.",
  ].join(" ");
};

const buildContextPayload = async ({ event, user, analytics }) => {
  const resolvedEvent = await resolveEvent(event);
  const resolvedUser = await resolveUser(user);
  const ticketContext = resolvedEvent?._id ? await loadTicketContext(resolvedEvent._id, resolvedUser?._id) : null;

  return {
    event: resolvedEvent,
    user: resolvedUser,
    analytics: analytics || resolvedEvent?.analytics || null,
    tickets: ticketContext,
  };
};

const buildUserPrompt = (message, context) => {
  const promptParts = [
    `User request: ${sanitizeText(message)}`,
  ];

  if (context.event) {
    promptParts.push("Event details:");
    promptParts.push(buildEventDetails(context.event));
  }

  if (context.tickets) {
    promptParts.push("Ticket summary:");
    promptParts.push(`Total ordered: ${context.tickets.totalOrders}\nTickets sold: ${context.tickets.ticketsSold}\nRevenue: ${context.tickets.revenue}`);
    if (context.tickets.userTickets.length) {
      promptParts.push(`User ticket history: ${context.tickets.userTickets.length} purchases`);
    }
  }

  if (context.analytics) {
    promptParts.push("Analytics summary:");
    promptParts.push(buildAnalyticsSummary(context.analytics, context.event));
  }

  if (context.user) {
    promptParts.push("User profile:");
    promptParts.push(buildUserSummary(context.user));
  }

  promptParts.push("Answer based only on the provided information and keep the response aligned with the user's role.");

  return promptParts.filter(Boolean).join("\n\n");
}; 

const createAIResponse = async ({ role, message, context = {} }) => {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  const safeRole = role === "organizer" ? "organizer" : "user";
  const safeMessage = sanitizeText(message);
  const cleanedContext = sanitizeContextObject(context);
  const contextPayload = await buildContextPayload(cleanedContext);

  const messages = [
    { role: "system", content: getSystemPrompt(safeRole) },
    { role: "user", content: buildUserPrompt(safeMessage, contextPayload) },
  ];

  try {
    const response = await axios.post(
      OPENAI_URL,
      {
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 700,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    const answer = String(response.data?.choices?.[0]?.message?.content || "").trim();
    return {
      role: safeRole,
      answer,
      model: OPENAI_MODEL,
      context: {
        event: contextPayload.event ? { id: contextPayload.event._id || null, title: contextPayload.event.title } : null,
        user: contextPayload.user ? { id: contextPayload.user._id || null, name: contextPayload.user.name || null, role: contextPayload.user.role || null } : null,
        analytics: contextPayload.analytics ? { summary: sanitizeText(buildAnalyticsSummary(contextPayload.analytics, contextPayload.event)) } : null,
      },
    };
  } catch (error) {
    const messageOverride = error.response?.data?.error?.message || error.message || "AI service unavailable.";
    const statusCode = error.response?.status || 502;
    const err = new Error(`AI request failed: ${messageOverride}`);
    err.status = statusCode;
    throw err;
  }
};

const generateEventFromPrompt = async ({ prompt }) => {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
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
      OPENAI_URL,
      {
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

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

    return { success: true, event: eventData };
  } catch (error) {
    const messageOverride = error.response?.data?.error?.message || error.message || "Event generation failed.";
    const statusCode = error.response?.status || 502;
    const err = new Error(`Event generation error: ${messageOverride}`);
    err.status = statusCode;
    throw err;
  }
};

module.exports = { createAIResponse, generateEventFromPrompt };
