import {
  PartyPopper,
  Rocket,
  Sparkles,
  AlertTriangle,
  Clock,
  Bell,
  BellRing,
  Radio,
  Video,
  Frown,
  Tag,
  Timer,
  CalendarDays,
  MapPin,
  Ticket,
  Wallet,
  ArrowRight,
  Share2,
} from "lucide-react";

// ─── Caption Types ────────────────────────────────────────────────────────────

export const CAPTION_TYPES = {
  LAUNCH:     "launch",
  URGENCY:    "urgency",
  REMINDER:   "reminder",
  LIVESTREAM: "livestream",
  SOLD_OUT:   "soldout",
  COUNTDOWN:  "countdown",
};

// ─── Icon Registry ────────────────────────────────────────────────────────────
// Maps semantic keys to Lucide icon components.
// UI layer should import these and render: <Icon size={16} />

export const CAPTION_ICONS = {
  launch:    PartyPopper,
  rocket:    Rocket,
  sparkles:  Sparkles,
  urgency:   AlertTriangle,
  clock:     Clock,
  reminder:  Bell,
  bell_ring: BellRing,
  live:      Radio,
  video:     Video,
  sold_out:  Frown,
  early:     Tag,
  countdown: Timer,
  date:      CalendarDays,
  location:  MapPin,
  ticket:    Ticket,
  price:     Wallet,
  cta:       ArrowRight,
  share:     Share2,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMinPrice(event) {
  if (event.isFree) return 0;
  const tiers  = Array.isArray(event.pricing) ? event.pricing : [];
  const prices = tiers
    .filter((t) => t.isEnabled !== false && !t.isFree)
    .map((t)    => Number(t.price || 0));
  return prices.length ? Math.min(...prices) : 0;
}

function formatDate(event) {
  if (!event.startDate) return null;
  return new Date(event.startDate).toLocaleDateString("en-NG", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
  });
}

function buildShareUrl(event, refCode, overrideUrl) {
  const base = overrideUrl || `${window.location.origin}/event/${event._id}`;
  return !overrideUrl && refCode ? `${base}?ref=${refCode}` : base;
}

function lines(...parts) {
  return parts.filter(Boolean).join("\n");
}

// ─── Caption Line Builders ────────────────────────────────────────────────────
// Each returns a { icon, text } line object. UI renders icon + text together.

function dateLine(date, time) {
  if (!date) return null;
  return { icon: "date", text: `${date}${time ? ` at ${time}` : ""}` };
}

function locationLine(location) {
  if (!location) return null;
  return { icon: "location", text: location };
}

function priceLine(price) {
  const label = price > 0 ? `₦${price.toLocaleString()}` : "FREE";
  return { icon: "ticket", text: price > 0 ? `Tickets from ${label}` : "Free entry" };
}

function ctaLine(url, label = "Get your ticket now") {
  return { icon: "cta", text: `${label}\n${url}` };
}

// ─── Template Builders ────────────────────────────────────────────────────────
// Each template is an array of { icon, text } line objects.

function buildLaunchTemplates(event, shareUrl, date, price) {
  const time     = event.startTime || "";
  const location = event.location  || "";

  return [
    [
      { icon: "launch",   text: `*${event.title}*` },
      dateLine(date, time),
      locationLine(location),
      priceLine(price),
      ctaLine(shareUrl),
    ],
    [
      { icon: "rocket",   text: `Check out *${event.title}*` },
      dateLine(date, time),
      locationLine(location),
      { icon: "price",    text: price > 0 ? `₦${price.toLocaleString()}` : "FREE" },
      ctaLine(shareUrl, "Don't miss it — grab your spot"),
    ],
    [
      { icon: "sparkles", text: `You're invited to *${event.title}*` },
      dateLine(date, time),
      locationLine(location),
      ctaLine(shareUrl),
    ],
  ];
}

function buildUrgencyTemplates(event, shareUrl, date, price) {
  const time     = event.startTime || "";
  const location = event.location  || "";
  const priceStr = price > 0 ? `₦${price.toLocaleString()}` : "FREE";

  return [
    [
      { icon: "urgency",  text: `Almost sold out! *${event.title}*` },
      dateLine(date, time),
      locationLine(location),
      { icon: "clock",    text: `Only a few tickets left at ${priceStr}` },
      ctaLine(shareUrl, "Secure yours NOW"),
    ],
    [
      { icon: "clock",    text: `Last chance! Tickets for *${event.title}* are running out.` },
      date || location
        ? { icon: "date", text: [date, location].filter(Boolean).join(" • ") }
        : null,
      { icon: "price",    text: `From ${priceStr}` },
      ctaLine(shareUrl),
    ],
  ];
}

function buildReminderTemplates(event, shareUrl, date) {
  const time     = event.startTime || "";
  const location = event.location  || "";

  return [
    [
      { icon: "reminder", text: date ? `Reminder: *${event.title}* is happening ${date}!` : `Reminder: *${event.title}*` },
      locationLine(location),
      time ? { icon: "clock", text: time } : null,
      ctaLine(shareUrl, "Haven't grabbed your ticket yet?"),
    ],
    [
      { icon: "bell_ring", text: date ? `Don't forget! *${event.title}* is ${date}.` : `Don't forget *${event.title}*!` },
      ctaLine(shareUrl, "Make sure you have your ticket"),
    ],
  ];
}

function buildLivestreamTemplates(event, shareUrl) {
  return [
    [
      { icon: "live",  text: `*${event.title}* is LIVE RIGHT NOW!` },
      ctaLine(shareUrl, "Join us"),
      { icon: "share", text: "Share with your friends!" },
    ],
    [
      { icon: "video", text: `We're LIVE! *${event.title}*` },
      ctaLine(shareUrl, "Watch now"),
    ],
  ];
}

function buildSoldOutTemplates(event, shareUrl) {
  return [
    [
      { icon: "sold_out", text: `*${event.title}* is SOLD OUT!` },
      ctaLine(shareUrl, "Join the waitlist"),
    ],
  ];
}

function buildCountdownTemplates(event, shareUrl, date, price) {
  const time     = event.startTime || "";
  const location = event.location  || "";
  const priceStr = price > 0 ? `₦${price.toLocaleString()}` : "FREE";

  const daysLeft = event.startDate
    ? Math.ceil((new Date(event.startDate) - Date.now()) / 86_400_000)
    : null;

  const countdownText = daysLeft !== null && daysLeft > 0
    ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} to go!`
    : "Starting very soon!";

  return [
    [
      { icon: "countdown", text: `${countdownText} *${event.title}*` },
      dateLine(date, time),
      locationLine(location),
      { icon: "price",     text: `From ${priceStr}` },
      ctaLine(shareUrl, "Get your ticket before it's too late"),
    ],
    [
      { icon: "countdown", text: `*${event.title}* is almost here — ${countdownText}` },
      dateLine(date, time),
      locationLine(location),
      ctaLine(shareUrl),
    ],
  ];
}

// ─── Template Registry ────────────────────────────────────────────────────────

const TEMPLATE_BUILDERS = {
  [CAPTION_TYPES.LAUNCH]:     buildLaunchTemplates,
  [CAPTION_TYPES.URGENCY]:    buildUrgencyTemplates,
  [CAPTION_TYPES.REMINDER]:   buildReminderTemplates,
  [CAPTION_TYPES.LIVESTREAM]: buildLivestreamTemplates,
  [CAPTION_TYPES.SOLD_OUT]:   buildSoldOutTemplates,
  [CAPTION_TYPES.COUNTDOWN]:  buildCountdownTemplates,
};

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Generate a WhatsApp share caption as structured line objects.
 *
 * @param {object}      event       - Event document
 * @param {string}      type        - One of CAPTION_TYPES values
 * @param {string|null} refCode     - Optional referral code
 * @param {number}      seed        - Incremented to cycle templates (Regenerate)
 * @param {string|null} overrideUrl - Use this URL instead of building one
 *
 * @returns {{ lines: Array<{ icon: string, text: string }>, plainText: string }}
 *   - lines     → render with CAPTION_ICONS[line.icon] in your UI
 *   - plainText → pass to buildWhatsAppLink() for the share URL
 */
export function generateWhatsAppCaption(
  event,
  type        = CAPTION_TYPES.LAUNCH,
  refCode     = null,
  seed        = 0,
  overrideUrl = null,
) {
  const shareUrl = buildShareUrl(event, refCode, overrideUrl);
  const date     = formatDate(event);
  const price    = getMinPrice(event);

  const builder   = TEMPLATE_BUILDERS[type] ?? TEMPLATE_BUILDERS[CAPTION_TYPES.LAUNCH];
  const templates = builder(event, shareUrl, date, price);
  const template  = templates[seed % templates.length];

  const lineObjects = template.filter(Boolean);
  const plainText   = lineObjects.map((l) => l.text).join("\n");

  return { lines: lineObjects, plainText };
}

// ─── WhatsApp & Referral Utilities ───────────────────────────────────────────

export function buildWhatsAppLink(plainText) {
  return `https://wa.me/?text=${encodeURIComponent(plainText)}`;
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