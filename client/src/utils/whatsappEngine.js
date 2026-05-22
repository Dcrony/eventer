/**
 * WhatsApp Distribution Engine
 * Generates captions, share links, and tracks referrals.
 * Reuses: getEventUrl from eventHelpers, shareCount tracking from eventController.
 */

// ─── Caption Templates ────────────────────────────────────────────────────────

const CAPTION_TYPES = {
  LAUNCH:    "launch",
  URGENCY:   "urgency",
  REMINDER:  "reminder",
  LIVESTREAM:"livestream",
  SOLD_OUT:  "soldout",
};

/**
 * Generate a WhatsApp share caption for an event.
 * @param {object} event   - Event document (title, location, startDate, pricing, etc.)
 * @param {string} type    - One of CAPTION_TYPES
 * @param {string} refCode - Optional referral code to embed in the link
 */
export function generateWhatsAppCaption(event, type = CAPTION_TYPES.LAUNCH, refCode = null) {
  const baseUrl  = `${window.location.origin}/event/${event._id}`;
  const shareUrl = refCode ? `${baseUrl}?ref=${refCode}` : baseUrl;
  const date     = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" })
    : "soon";
  const time     = event.startTime || "";
  const location = event.location || "Online";
  const price    = getMinPrice(event);
  const priceStr = price > 0 ? `₦${price.toLocaleString()}` : "FREE";

  const templates = {
    [CAPTION_TYPES.LAUNCH]: [
      `🎉 *${event.title}* is now LIVE!\n\n📅 ${date}${time ? ` at ${time}` : ""}\n📍 ${location}\n🎟️ Tickets from ${priceStr}\n\nGet your ticket now 👇\n${shareUrl}`,
      `Hey! You're invited to *${event.title}* 🚀\n\n📅 ${date}\n📍 ${location}\n💰 ${priceStr}\n\nDon't miss it — grab your spot:\n${shareUrl}`,
    ],
    [CAPTION_TYPES.URGENCY]: [
      `⚠️ Almost sold out! *${event.title}*\n\n📅 ${date}\n📍 ${location}\n🔥 Only a few tickets left at ${priceStr}\n\nSecure yours NOW before it's gone:\n${shareUrl}`,
      `⏰ Last chance! Tickets for *${event.title}* are running out fast.\n\n${date} • ${location}\nFrom ${priceStr}\n\n👉 ${shareUrl}`,
    ],
    [CAPTION_TYPES.REMINDER]: [
      `📣 Reminder: *${event.title}* is happening ${date}!\n\n📍 ${location}${time ? `\n🕐 ${time}` : ""}\n\nHaven't grabbed your ticket yet?\n👉 ${shareUrl}`,
      `🔔 Don't forget! *${event.title}* is ${date}.\n\nMake sure you have your ticket:\n${shareUrl}`,
    ],
    [CAPTION_TYPES.LIVESTREAM]: [
      `🔴 *${event.title}* is LIVE RIGHT NOW!\n\nJoin us and watch the stream:\n👉 ${shareUrl}\n\nShare with your friends! 📲`,
      `We're LIVE! 🎥 *${event.title}*\n\nWatch now:\n${shareUrl}`,
    ],
    [CAPTION_TYPES.SOLD_OUT]: [
      `😲 *${event.title}* is SOLD OUT!\n\nJoin the waitlist — we might open more spots:\n👉 ${shareUrl}`,
    ],
  };

  const pool = templates[type] || templates[CAPTION_TYPES.LAUNCH];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Build a WhatsApp deep-link for immediate share.
 */
export function buildWhatsAppLink(caption) {
  return `https://wa.me/?text=${encodeURIComponent(caption)}`;
}

/**
 * Build a referral URL for an event + user combo.
 */
export function buildReferralUrl(eventId, userId) {
  const code = btoa(`${eventId}:${userId}`).replace(/=/g, "");
  return `${window.location.origin}/event/${eventId}?ref=${code}`;
}

/**
 * Decode a referral code back to { eventId, userId }.
 */
export function decodeReferralCode(code) {
  try {
    const padded  = code + "=".repeat((4 - (code.length % 4)) % 4);
    const decoded = atob(padded);
    const [eventId, userId] = decoded.split(":");
    return { eventId, userId };
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMinPrice(event) {
  if (event.isFree) return 0;
  const tiers = Array.isArray(event.pricing) ? event.pricing : [];
  const prices = tiers.filter((t) => t.isEnabled !== false && !t.isFree).map((t) => Number(t.price || 0));
  return prices.length ? Math.min(...prices) : 0;
}

export { CAPTION_TYPES };