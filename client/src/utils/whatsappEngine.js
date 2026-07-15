const CAPTION_TYPES = {
  LAUNCH:     "launch",
  URGENCY:    "urgency",
  REMINDER:   "reminder",
  LIVESTREAM: "livestream",
  SOLD_OUT:   "soldout",
};

/**
 * Generate a WhatsApp share caption.
 *
 * @param {object}      event        - Event document (or synthetic profile object)
 * @param {string}      type         - One of CAPTION_TYPES values
 * @param {string|null} refCode      - Optional referral code (appended as ?ref=)
 * @param {number}      seed         - Increment to cycle through templates (Regenerate)
 * @param {string|null} overrideUrl  - Use this URL in the caption instead of building one
 */
export function generateWhatsAppCaption(
  event,
  type = CAPTION_TYPES.LAUNCH,
  refCode = null,
  seed = 0,
  overrideUrl = null,
) {
  // URL in the caption: use override if provided (e.g. profile URL),
  // otherwise build the standard event URL with optional ref code.
  const baseUrl  = overrideUrl || `${window.location.origin}/event/${event._id}`;
  const shareUrl = (!overrideUrl && refCode) ? `${baseUrl}?ref=${refCode}` : baseUrl;

  const date = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-NG", {
        weekday: "long", month: "long", day: "numeric",
      })
    : null;

  const time     = event.startTime || "";
  const location = event.location  || "";
  const price    = getMinPrice(event);
  const priceStr = price > 0 ? `₦${price.toLocaleString()}` : "FREE";

  // Location/date line — only include if data exists
  const dateLine     = date     ? `${date}${time ? ` at ${time}` : ""}` : null;
  const locationLine = location ? `${location}`                          : null;

  const templates = {
    [CAPTION_TYPES.LAUNCH]: [
      [
        `*${event.title}*`,
        dateLine,
        locationLine,
        price > 0 ? `Tickets from ${priceStr}` : "Free entry",
        `\nGet your ticket now\n${shareUrl}`,
      ].filter(Boolean).join("\n"),

      [
        `Hey! Check out *${event.title}*`,
        dateLine,
        locationLine,
        `${priceStr}`,
        `\nDon't miss it — grab your spot:\n${shareUrl}`,
      ].filter(Boolean).join("\n"),

      [
        `You're invited to *${event.title}*`,
        dateLine,
        locationLine,
        `\n${shareUrl}`,
      ].filter(Boolean).join("\n"),
    ],

    [CAPTION_TYPES.URGENCY]: [
      [
        `Almost sold out! *${event.title}*`,
        dateLine,
        locationLine,
        `Only a few tickets left at ${priceStr}`,
        `\nSecure yours NOW:\n${shareUrl}`,
      ].filter(Boolean).join("\n"),

      [
        `Last chance! Tickets for *${event.title}* are running out.`,
        [dateLine, locationLine].filter(Boolean).join(" • "),
        `From ${priceStr}`,
        `\n${shareUrl}`,
      ].filter(Boolean).join("\n"),
    ],

    [CAPTION_TYPES.REMINDER]: [
      [
        date ? `Reminder: *${event.title}* is happening ${date}!` : `Reminder: *${event.title}*`,
        locationLine,
        time ? `${time}` : null,
        `\nHaven't grabbed your ticket yet?\n${shareUrl}`,
      ].filter(Boolean).join("\n"),

      [
        date ? `Don't forget! *${event.title}* is ${date}.` : `Don't forget *${event.title}*!`,
        `\nMake sure you have your ticket:\n${shareUrl}`,
      ].filter(Boolean).join("\n"),
    ],

    [CAPTION_TYPES.LIVESTREAM]: [
      `*${event.title}* is LIVE RIGHT NOW!\n\nJoin us:\n${shareUrl}\n\nShare with your friends!`,
      `We're LIVE! *${event.title}*\n\nWatch now:\n${shareUrl}`,
    ],

    [CAPTION_TYPES.SOLD_OUT]: [
      `*${event.title}* is SOLD OUT!\n\nJoin the waitlist:\n${shareUrl}`,
    ],
  };

  const pool = templates[type] || templates[CAPTION_TYPES.LAUNCH];
  return pool[seed % pool.length];
}

export function buildWhatsAppLink(caption) {
  return `https://wa.me/?text=${encodeURIComponent(caption)}`;
}

export function buildReferralUrl(eventId, userId) {
  const code = btoa(`${eventId}:${userId}`).replace(/=/g, "");
  return `${window.location.origin}/event/${eventId}?ref=${code}`;
}

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

function getMinPrice(event) {
  if (event.isFree) return 0;
  const tiers  = Array.isArray(event.pricing) ? event.pricing : [];
  const prices = tiers
    .filter((t) => t.isEnabled !== false && !t.isFree)
    .map((t) => Number(t.price || 0));
  return prices.length ? Math.min(...prices) : 0;
}

export { CAPTION_TYPES };