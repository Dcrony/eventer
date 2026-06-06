const mongoose = require("mongoose");
const Rating = require("../models/Rating");
const Report = require("../models/Report");
const Ticket = require("../models/Ticket");
const Event = require("../models/Event");
const User = require("../models/User");
const reputationService = require("../services/reputationService");
const { createNotification } = require("../services/notificationService");

exports.submitReview = async (req, res) => {
  try {
    const { targetType, targetId, rating, review, organizerAspects, eventAspects, eventId } = req.body;
    const reviewerId = req.user._id || req.user.id;

    if (!["event", "organizer"].includes(targetType)) {
      return res.status(400).json({ message: "Invalid target type" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (targetType === "event") {
      const event = await Event.findById(targetId).lean();
      if (!event) return res.status(404).json({ message: "Event not found" });
    } else if (targetType === "organizer") {
      const organizer = await User.findById(targetId).lean();
      if (!organizer) return res.status(404).json({ message: "Organizer not found" });
    }

    const existingReview = await Rating.findOne({
      reviewer: reviewerId,
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
    });

    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this" });
    }

    let wasAttendee = false;
    if (targetType === "event" && eventId) {
      wasAttendee = await reputationService.didUserAttendEvent(reviewerId, eventId);
    }

    const newRating = new Rating({
      reviewer: reviewerId,
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      event: eventId || null,
      organizer: targetType === "organizer" ? targetId : null,
      rating,
      review: review || "",
      organizerAspects: organizerAspects || {},
      eventAspects: eventAspects || {},
      wasAttendee,
      ticket: null,
    });

    if (targetType === "event" && eventId) {
      const ticket = await Ticket.findOne({
        buyer: reviewerId,
        event: eventId,
        status: { $in: ["valid", "used", "scanned"] },
      }).lean();

      if (ticket) {
        newRating.ticket = ticket._id;
      }
    }

    await newRating.save();

    if (targetType === "event") {
      const event = await Event.findById(targetId).populate("createdBy", "_id");
      if (event && event.createdBy) {
        await createNotification(req.app, {
          userId: event.createdBy._id,
          actorId: reviewerId,
          type: "event_reviewed",
          message: `Your event "${event.title}" received a ${rating}-star review`,
          actionUrl: `/events/${eventId}`,
          entityId: newRating._id,
          entityType: "Rating",
        }).catch((e) => console.error("Notification error:", e));
      }
    } else if (targetType === "organizer") {
      await createNotification(req.app, {
        userId: targetId,
        actorId: reviewerId,
        type: "organizer_reviewed",
        message: `You received a ${rating}-star review from an attendee`,
        actionUrl: `/profile/${targetId}`,
        entityId: newRating._id,
        entityType: "Rating",
      }).catch((e) => console.error("Notification error:", e));
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: newRating,
    });
  } catch (error) {
    console.error("submitReview error:", error);
    res.status(500).json({ message: "Failed to submit review" });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { targetType, targetId, limit = 5, skip = 0 } = req.query;

    if (!["event", "organizer"].includes(targetType)) {
      return res.status(400).json({ message: "Invalid target type" });
    }

    const reviews = await Rating.find({
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      isVisible: true,
    })
      .populate("reviewer", "name username profilePic")
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const total = await Rating.countDocuments({
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      isVisible: true,
    });

    res.json({
      success: true,
      reviews,
      pagination: { limit: Number(limit), skip: Number(skip), total },
    });
  } catch (error) {
    console.error("getReviews error:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

exports.getRatingStats = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;

    if (!["event", "organizer"].includes(targetType)) {
      return res.status(400).json({ message: "Invalid target type" });
    }

    const stats = await reputationService.getRatingStats(targetType, targetId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("getRatingStats error:", error);
    res.status(500).json({ message: "Failed to fetch rating stats" });
  }
};

exports.getOrganizerReputation = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const organizer = await User.findById(organizerId).lean();
    if (!organizer) return res.status(404).json({ message: "Organizer not found" });

    const trustScore = await reputationService.calculateOrganizerTrustScore(organizerId);
    const ratingStats = await reputationService.getRatingStats("organizer", organizerId);
    const aspectRatings = await reputationService.getOrganizerAspectRatings(organizerId);
    const recentReviews = await reputationService.getReviews("organizer", organizerId, 5);

    res.json({
      success: true,
      reputation: {
        trustScore,
        ratingStats,
        aspectRatings,
        recentReviews,
      },
    });
  } catch (error) {
    console.error("getOrganizerReputation error:", error);
    res.status(500).json({ message: "Failed to fetch organizer reputation" });
  }
};

exports.submitReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description, eventId } = req.body;
    const reporterId = req.user._id || req.user.id;

    if (!["event", "organizer"].includes(targetType)) {
      return res.status(400).json({ message: "Invalid target type" });
    }

    const validReasons = [
      "spam",
      "inappropriate_content",
      "fraud",
      "unsafe_event",
      "false_information",
      "copyright",
      "harassment",
      "other",
    ];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ message: "Invalid reason" });
    }

    if (targetType === "event") {
      const event = await Event.findById(targetId).lean();
      if (!event) return res.status(404).json({ message: "Event not found" });
    } else if (targetType === "organizer") {
      const organizer = await User.findById(targetId).lean();
      if (!organizer) return res.status(404).json({ message: "Organizer not found" });
    }

    const existingReport = await Report.findOne({
      reporter: reporterId,
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      status: { $in: ["open", "investigating"] },
    });

    if (existingReport) {
      return res.status(400).json({ message: "You have already reported this" });
    }

    const newReport = new Report({
      reporter: reporterId,
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      event: eventId || null,
      organizer: targetType === "organizer" ? targetId : null,
      reason,
      description: description || "",
      status: "open",
    });

    await newReport.save();

    res.status(201).json({
      success: true,
      message: "Report submitted. Thank you for helping keep TickiSpot safe.",
      report: newReport,
    });
  } catch (error) {
    console.error("submitReport error:", error);
    res.status(500).json({ message: "Failed to submit report" });
  }
};

exports.adminGetReports = async (req, res) => {
  try {
    const { status = "open", limit = 20, skip = 0 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate("reporter", "name email username")
      .populate("organizer", "name username")
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const total = await Report.countDocuments(filter);

    res.json({
      success: true,
      reports,
      pagination: { limit: Number(limit), skip: Number(skip), total },
    });
  } catch (error) {
    console.error("adminGetReports error:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
};

exports.adminResolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, actionTaken, resolutionNotes } = req.body;

    const validStatuses = ["resolved", "rejected", "investigating"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const validActions = [
      "none",
      "warning",
      "content_removed",
      "account_suspended",
      "account_banned",
    ];
    if (actionTaken && !validActions.includes(actionTaken)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        status,
        actionTaken: actionTaken || "none",
        resolutionNotes: resolutionNotes || "",
        resolvedAt: status === "resolved" ? new Date() : null,
        resolvedBy: req.user._id,
      },
      { new: true }
    );

    if (!report) return res.status(404).json({ message: "Report not found" });

    res.json({
      success: true,
      message: "Report resolved",
      report,
    });
  } catch (error) {
    console.error("adminResolveReport error:", error);
    res.status(500).json({ message: "Failed to resolve report" });
  }
};

exports.markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { helpful = true } = req.body;

    const rating = await Rating.findById(reviewId);
    if (!rating) return res.status(404).json({ message: "Review not found" });

    if (helpful) {
      rating.helpful += 1;
    } else {
      rating.unhelpful += 1;
    }

    await rating.save();

    res.json({ success: true, rating });
  } catch (error) {
    console.error("markReviewHelpful error:", error);
    res.status(500).json({ message: "Failed to update review" });
  }
};