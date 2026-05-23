/**
 * ogRoutes.js — Open Graph / Social Sharing Meta Tags
 *
 * Replaces the existing inline app.get("/event/:id") and app.get("/users/:id")
 * handlers in server.js.
 *
 * Changes from existing code:
 *   1. Fetches Cloudinary-stored images correctly (they're full HTTPS URLs)
 *   2. Handles both event.image (legacy local) and event.banner (Cloudinary)
 *   3. Handles both user.profilePic (legacy) and full Cloudinary URLs
 *   4. Returns proper 200 with meta tags so crawlers index them
 *   5. Adds og:image:width/height and twitter:image for better previews
 *
 * Mount BEFORE express.json() in server.js:
 *   const ogRoutes = require("./routes/ogRoutes");
 *   app.use(ogRoutes);
 */

const express = require("express");
const router  = express.Router();
const Event   = require("../models/Event");
const User    = require("../models/User");

const BACKEND_URL  = process.env.BACKEND_URL  || "http://localhost:8080";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/* ─── Escape HTML ─────────────────────────────────────────────────────────── */
function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ─── Resolve a stored media value to a full HTTPS URL ───────────────────── */
function resolveMediaUrl(value) {
  if (!value) return null;
  const s = String(value).trim();
  // Already a full URL (Cloudinary or external)
  if (/^https?:\/\//i.test(s)) return s;
  // Legacy local path
  const normalized = s.replace(/^\/+/, "");
  return `${BACKEND_URL}/${normalized}`;
}

/* ─── Get best image for an event ───────────────────────────────────────── */
function getEventImage(event) {
  // Prefer Cloudinary banner field, fall back to image field
  if (event.banner) return resolveMediaUrl(event.banner);
  if (event.image)  return resolveMediaUrl(event.image);
  return null;
}

/* ─── Get best image for a user ─────────────────────────────────────────── */
function getUserImage(user) {
  if (user.profilePic) return resolveMediaUrl(user.profilePic);
  return null;
}

/* ─── Build OG HTML shell ────────────────────────────────────────────────── */
function buildOgPage({ title, description, image, url, type = "website", redirectPath }) {
  const safeTitle   = esc(title);
  const safeDesc    = esc(description || "");
  const safeImage   = image ? esc(image) : "";
  const safeUrl     = esc(url);
  const safePath    = esc(redirectPath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${safeTitle}</title>

  <!-- Primary -->
  <meta name="description" content="${safeDesc}" />

  <!-- Open Graph -->
  <meta property="og:type"        content="${esc(type)}" />
  <meta property="og:title"       content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url"         content="${safeUrl}" />
  ${safeImage ? `<meta property="og:image"       content="${safeImage}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt"    content="${safeTitle}" />` : ""}

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="${safeImage ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title"       content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  ${safeImage ? `<meta name="twitter:image" content="${safeImage}" />` : ""}

  <!-- WhatsApp / iMessage read og: tags — nothing extra needed -->
</head>
<body>
  <script>window.location.replace("${safePath}");</script>
  <p><a href="${safePath}">Click here if not redirected</a></p>
</body>
</html>`;
}

/* ─── Event OG route ─────────────────────────────────────────────────────── */
router.get("/event/:id", async (req, res, next) => {
  // Only handle requests from crawlers / link previewers.
  // Real user navigation is handled client-side by React Router.
  const ua = req.headers["user-agent"] || "";
  const isCrawler = /facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Slackbot|Googlebot|bingbot|DuckDuckBot|Applebot/i.test(ua);

  // For non-crawlers just redirect straight to the SPA
  if (!isCrawler) {
    return res.redirect(302, `${FRONTEND_URL}/event/${req.params.id}`);
  }

  try {
    const event = await Event.findById(req.params.id).populate("createdBy", "name username");
    if (!event) return res.status(404).send("Event not found");

    const image       = getEventImage(event);
    const title       = `${event.title} — TickiSpot`;
    const description = event.description
      ? event.description.slice(0, 200)
      : `Join ${event.title} on TickiSpot. Get your tickets now.`;
    const canonicalUrl = `${FRONTEND_URL}/event/${event._id}`;

    return res.status(200).send(
      buildOgPage({ title, description, image, url: canonicalUrl, redirectPath: canonicalUrl })
    );
  } catch (err) {
    console.error("OG event route error:", err.message);
    return next(err);
  }
});

/* ─── User / Profile OG route ───────────────────────────────────────────── */
router.get("/profile/:id", async (req, res, next) => {
  const ua        = req.headers["user-agent"] || "";
  const isCrawler = /facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Slackbot|Googlebot|bingbot|DuckDuckBot|Applebot/i.test(ua);

  if (!isCrawler) {
    return res.redirect(302, `${FRONTEND_URL}/profile/${req.params.id}`);
  }

  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const user = await User.findOne(
      isObjectId ? { _id: req.params.id } : { username: req.params.id }
    ).select("name username bio profilePic");

    if (!user) return res.status(404).send("User not found");

    const image        = getUserImage(user);
    const title        = `${user.name || user.username} — TickiSpot`;
    const description  = user.bio || `Check out ${user.name || user.username}'s events on TickiSpot.`;
    const canonicalUrl = `${FRONTEND_URL}/profile/${user._id}`;

    return res.status(200).send(
      buildOgPage({ title, description, image, url: canonicalUrl, type: "profile", redirectPath: canonicalUrl })
    );
  } catch (err) {
    console.error("OG profile route error:", err.message);
    return next(err);
  }
});

/* ─── Also handle /users/:id for legacy compatibility ──────────────────── */
router.get("/users/:id", async (req, res, next) => {
  const ua        = req.headers["user-agent"] || "";
  const isCrawler = /facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Slackbot|Googlebot|bingbot|DuckDuckBot|Applebot/i.test(ua);

  if (!isCrawler) {
    return res.redirect(302, `${FRONTEND_URL}/users/${req.params.id}`);
  }

  try {
    const user = await User.findById(req.params.id).select("name username bio profilePic");
    if (!user) return res.status(404).send("User not found");

    const image        = getUserImage(user);
    const title        = `${user.name || user.username} — TickiSpot`;
    const description  = user.bio || `Events by ${user.name || user.username} on TickiSpot.`;
    const canonicalUrl = `${FRONTEND_URL}/users/${user._id}`;

    return res.status(200).send(
      buildOgPage({ title, description, image, url: canonicalUrl, type: "profile", redirectPath: canonicalUrl })
    );
  } catch (err) {
    console.error("OG users route error:", err.message);
    return next(err);
  }
});

module.exports = router;