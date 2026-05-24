const express = require("express");
const router  = express.Router();
const Event   = require("../models/Event");
const User    = require("../models/User");

const BACKEND_URL  = (process.env.BACKEND_URL  || "http://localhost:8080").replace(/\/$/, "");
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

// Crawlers that need OG meta tags served directly.
// WhatsApp sends "WhatsApp/2.x" — must be in this list.
const CRAWLER_RE = /facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Slackbot|Googlebot|bingbot|DuckDuckBot|Applebot|Discordbot|Slurp|ia_archiver/i;

function isCrawler(req) {
  return CRAWLER_RE.test(req.headers["user-agent"] || "");
}

function esc(str) {
  return String(str || "")
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#39;");
}

// Resolve any stored value → full public URL.
// Your Cloudinary uploads are stored as full https:// URLs in event.image.
// Legacy local files are stored as filenames like "1234.jpg" or "uploads/event_image/1234.jpg".
function resolveMediaUrl(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (!s || s === "null" || s === "undefined") return null;
  // Already a full Cloudinary / S3 / external URL — return as-is
  if (/^https?:\/\//i.test(s)) return s;
  // Legacy local file — prefix backend origin
  return `${BACKEND_URL}/${s.replace(/^\/+/, "")}`;
}

// Event image: your uploadImageBuffer stores the Cloudinary URL in event.image
// (see ticketController / eventController — they both do: uploaded.secure_url → event.image)
// event.banner does not exist on the Event schema — skip it.
function getEventImage(event) {
  if (event.image)  return resolveMediaUrl(event.image);
  if (event.banner) return resolveMediaUrl(event.banner); // future-proof
  return null;
}

function getUserImage(user) {
  if (user.profilePic) return resolveMediaUrl(user.profilePic);
  return null;
}

function buildOgHtml({ title, description, image, canonicalUrl, type }) {
  const t = esc(title);
  const d = esc((description || "").slice(0, 300));
  const u = esc(canonicalUrl);

  const imgBlock = image ? `
  <meta property="og:image"            content="${esc(image)}"/>
  <meta property="og:image:secure_url" content="${esc(image)}"/>
  <meta property="og:image:width"      content="1200"/>
  <meta property="og:image:height"     content="630"/>
  <meta property="og:image:alt"        content="${t}"/>
  <meta name="twitter:card"            content="summary_large_image"/>
  <meta name="twitter:image"           content="${esc(image)}"/>` : `
  <meta name="twitter:card" content="summary"/>`;

  // IMPORTANT: no redirect here. Crawlers don't run JS and don't follow
  // meta-refresh quickly enough. Serve the full page at this URL.
  // The <a> tag is just a fallback for the rare human who lands here.
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${t}</title>
<meta name="description" content="${d}"/>
<meta property="og:type"        content="${esc(type || "website")}"/>
<meta property="og:site_name"   content="TickiSpot"/>
<meta property="og:title"       content="${t}"/>
<meta property="og:description" content="${d}"/>
<meta property="og:url"         content="${u}"/>${imgBlock}
<meta name="twitter:title"       content="${t}"/>
<meta name="twitter:description" content="${d}"/>
</head>
<body>
<p><a href="${u}">Open on TickiSpot</a></p>
<script>window.location.replace("${u}");</script>
</body>
</html>`;
}

// ── /event/:id ────────────────────────────────────────────────────────────────
router.get("/event/:id", async (req, res, next) => {
  // Real browsers navigating directly: redirect to the SPA immediately.
  // Crawlers: serve full OG HTML at this URL (no redirect — crawlers need
  // the tags on the exact URL they fetched).
  if (!isCrawler(req)) {
    return res.redirect(302, `${FRONTEND_URL}/event/${req.params.id}`);
  }

  try {
    const event = await Event
      .findById(req.params.id)
      .select("title description image banner location startDate startTime createdBy")
      .populate("createdBy", "name username")
      .lean();

    if (!event) return res.status(404).send("Event not found");

    const image = getEventImage(event);

    const dateStr = event.startDate
      ? new Date(event.startDate).toLocaleDateString("en-NG", {
          weekday: "long", month: "long", day: "numeric", year: "numeric",
        })
      : null;

    const description = event.description
      ? event.description.slice(0, 200)
      : [
          `Join ${event.title} on TickiSpot.`,
          dateStr ? `Happening ${dateStr}.` : null,
          event.location ? `At ${event.location}.` : null,
          "Get your tickets now.",
        ].filter(Boolean).join(" ");

    return res
      .status(200)
      .set("Content-Type", "text/html; charset=utf-8")
      .send(buildOgHtml({
        title:        `${event.title} — TickiSpot`,
        description,
        image,
        canonicalUrl: `${FRONTEND_URL}/event/${event._id}`,
        type:         "website",
      }));
  } catch (err) {
    console.error("OG /event/:id error:", err.message);
    return next(err);
  }
});

// ── /profile/:id ──────────────────────────────────────────────────────────────
router.get("/profile/:id", async (req, res, next) => {
  if (!isCrawler(req)) {
    return res.redirect(302, `${FRONTEND_URL}/profile/${req.params.id}`);
  }

  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const user = await User
      .findOne(isObjectId ? { _id: req.params.id } : { username: req.params.id })
      .select("name username bio profilePic")
      .lean();

    if (!user) return res.status(404).send("User not found");

    const image       = getUserImage(user);
    const displayName = user.name || user.username;

    return res
      .status(200)
      .set("Content-Type", "text/html; charset=utf-8")
      .send(buildOgHtml({
        title:        `${displayName} — TickiSpot`,
        description:  user.bio || `Check out ${displayName}'s events on TickiSpot.`,
        image,
        canonicalUrl: `${FRONTEND_URL}/profile/${user._id}`,
        type:         "profile",
      }));
  } catch (err) {
    console.error("OG /profile/:id error:", err.message);
    return next(err);
  }
});

// ── /users/:id  (legacy path kept for backward compat) ────────────────────────
router.get("/users/:id", async (req, res, next) => {
  if (!isCrawler(req)) {
    return res.redirect(302, `${FRONTEND_URL}/users/${req.params.id}`);
  }

  try {
    const user = await User
      .findById(req.params.id)
      .select("name username bio profilePic")
      .lean();

    if (!user) return res.status(404).send("User not found");

    const image       = getUserImage(user);
    const displayName = user.name || user.username;

    return res
      .status(200)
      .set("Content-Type", "text/html; charset=utf-8")
      .send(buildOgHtml({
        title:        `${displayName} — TickiSpot`,
        description:  user.bio || `Events by ${displayName} on TickiSpot.`,
        image,
        canonicalUrl: `${FRONTEND_URL}/users/${user._id}`,
        type:         "profile",
      }));
  } catch (err) {
    console.error("OG /users/:id error:", err.message);
    return next(err);
  }
});

module.exports = router;