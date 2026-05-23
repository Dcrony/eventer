/**
 * referralController.js
 *
 * Handles referral link tracking, attribution, and analytics.
 * New routes — does NOT modify any existing controller.
 *
 * Endpoints:
 *   POST /api/referrals/track   — record a referral click
 *   POST /api/referrals/convert — record a ticket conversion via referral
 *   GET  /api/referrals/:eventId — get referral stats for an event (organizer only)
 *   GET  /api/referrals/leaderboard/:eventId — top promoters
 */

const mongoose = require("mongoose");
const Referral = require("../models/Referral");
const Event    = require("../models/Event");
const { authorizeEventAction } = require("../utils/eventPermissions");

/* ─── Track click ─────────────────────────────────────────────────────────── */
exports.trackReferralClick = async (req, res) => {
  try {
    const { eventId, referrerId, source = "whatsapp" } = req.body;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const visitorId = req.ip || "unknown";

    await Referral.findOneAndUpdate(
      { event: eventId, referrer: referrerId || null, visitorId },
      {
        $setOnInsert: { event: eventId, referrer: referrerId || null, visitorId, source, createdAt: new Date() },
        $inc: { clicks: 1 },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("trackReferralClick error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ─── Record conversion ───────────────────────────────────────────────────── */
exports.recordReferralConversion = async (req, res) => {
  try {
    const { eventId, referrerId, ticketCount = 1, revenue = 0 } = req.body;

    if (!eventId) return res.status(400).json({ message: "eventId required" });

    await Referral.findOneAndUpdate(
      { event: eventId, referrer: referrerId || null },
      {
        $inc: {
          conversions:  1,
          ticketsSold:  Number(ticketCount),
          totalRevenue: Number(revenue),
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("recordReferralConversion error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ─── Event referral analytics (organizer only) ───────────────────────────── */
exports.getEventReferralStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const lookup = await authorizeEventAction({
      eventId,
      user: req.user,
      permission: "canAccessAnalytics",
      deniedMessage: "You do not have permission to view referral analytics for this event",
    });
    if (lookup.error) return res.status(lookup.error.status).json({ message: lookup.error.message });

    const stats = await Referral.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId) } },
      {
        $group: {
          _id:          null,
          totalClicks:  { $sum: "$clicks" },
          conversions:  { $sum: "$conversions" },
          ticketsSold:  { $sum: "$ticketsSold" },
          totalRevenue: { $sum: "$totalRevenue" },
          uniqueRefs:   { $addToSet: "$referrer" },
        },
      },
    ]);

    const summary = stats[0] || { totalClicks: 0, conversions: 0, ticketsSold: 0, totalRevenue: 0, uniqueRefs: [] };

    return res.status(200).json({
      totalClicks:     summary.totalClicks,
      conversions:     summary.conversions,
      ticketsSold:     summary.ticketsSold,
      totalRevenue:    summary.totalRevenue,
      uniqueReferrers: summary.uniqueRefs.filter(Boolean).length,
      conversionRate:  summary.totalClicks
        ? Number(((summary.conversions / summary.totalClicks) * 100).toFixed(1))
        : 0,
    });
  } catch (err) {
    console.error("getEventReferralStats error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ─── Leaderboard ─────────────────────────────────────────────────────────── */
exports.getReferralLeaderboard = async (req, res) => {
  try {
    const { eventId } = req.params;

    const lookup = await authorizeEventAction({
      eventId,
      user: req.user,
      permission: "canAccessAnalytics",
      deniedMessage: "You do not have permission to view this leaderboard",
    });
    if (lookup.error) return res.status(lookup.error.status).json({ message: lookup.error.message });

    const leaderboard = await Referral.aggregate([
      { $match: { event: new mongoose.Types.ObjectId(eventId), referrer: { $ne: null } } },
      {
        $group: {
          _id:         "$referrer",
          clicks:      { $sum: "$clicks" },
          conversions: { $sum: "$conversions" },
          ticketsSold: { $sum: "$ticketsSold" },
          revenue:     { $sum: "$totalRevenue" },
        },
      },
      { $sort: { conversions: -1, clicks: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from:         "users",
          localField:   "_id",
          foreignField: "_id",
          as:           "user",
          pipeline:     [{ $project: { name: 1, username: 1, profilePic: 1 } }],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ]);

    return res.status(200).json(leaderboard);
  } catch (err) {
    console.error("getReferralLeaderboard error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};