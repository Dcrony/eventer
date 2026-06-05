/**
 * Reputation Service
 * Calculates trust scores, ratings aggregates, and organizer reputation
 */

const Rating = require("../models/Rating");
const Report = require("../models/Report");
const Ticket = require("../models/Ticket");
const User = require("../models/User");

/**
 * Calculate average rating and count for an organizer or event
 */
exports.getRatingStats = async (targetType, targetId) => {
  try {
    const stats = await Rating.aggregate([
      {
        $match: {
          targetType,
          targetId: mongoose.Types.ObjectId(targetId),
          isVisible: true,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
      {
        $project: {
          _id: 0,
          averageRating: { $round: ["$averageRating", 2] },
          totalRatings: 1,
          ratingCounts: {
            $reduce: {
              input: "$ratingDistribution",
              initialValue: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    [{ $toString: "$$this" }]: {
                      $add: [
                        {
                          $getField: {
                            field: { $toString: "$$this" },
                            input: "$$value",
                          },
                        },
                        1,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]);

    if (!stats.length) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    return stats[0];
  } catch (error) {
    console.error("Error calculating rating stats:", error);
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
};

/**
 * Calculate organizer trust score (0-100)
 * Based on:
 * - Verification status
 * - Average rating from attendees
 * - Total events completed
 * - Report/flag count
 * - Account age
 */
exports.calculateOrganizerTrustScore = async (organizerId) => {
  try {
    const mongoose = require("mongoose");
    const organizer = await User.findById(organizerId).lean();
    if (!organizer) return 0;

    let score = 50; // Base score

    // Verification boost: +30 points
    if (organizer.isVerified) {
      score += 30;
    }

    // Rating component: max +20 points
    const ratingStats = await this.getRatingStats("organizer", organizerId);
    if (ratingStats.totalRatings > 0) {
      const ratingScore = (ratingStats.averageRating / 5) * 20;
      score += ratingScore;
    }

    // Events completed: +5 points per 10 events (capped at 10)
    const eventCount = Math.min(Math.floor((organizer.eventCount || 0) / 10) * 5, 10);
    score += eventCount;

    // Report/flag penalty: -10 points per unresolved report
    const unresolvedReports = await Report.countDocuments({
      organizer: organizerId,
      status: { $in: ["open", "investigating"] },
    });
    score -= unresolvedReports * 10;

    // Account age: +5 points if account > 3 months old
    const accountAgeDays = Math.floor((Date.now() - organizer.createdAt) / (1000 * 60 * 60 * 24));
    if (accountAgeDays > 90) {
      score += 5;
    }

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, score));
  } catch (error) {
    console.error("Error calculating trust score:", error);
    return 0;
  }
};

/**
 * Get recent reviews for a target
 */
exports.getReviews = async (targetType, targetId, limit = 5, skip = 0) => {
  try {
    const reviews = await Rating.find({
      targetType,
      targetId: require("mongoose").Types.ObjectId(targetId),
      isVisible: true,
    })
      .populate("reviewer", "name username profilePic")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return reviews;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};

/**
 * Get aspect ratings for organizer
 * Average out all aspect ratings across reviews
 */
exports.getOrganizerAspectRatings = async (organizerId) => {
  try {
    const mongoose = require("mongoose");
    const aspects = await Rating.aggregate([
      {
        $match: {
          targetType: "organizer",
          targetId: mongoose.Types.ObjectId(organizerId),
          isVisible: true,
          organizerAspects: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          communication: {
            $avg: "$organizerAspects.communication",
          },
          professionalism: {
            $avg: "$organizerAspects.professionalism",
          },
          eventExecution: {
            $avg: "$organizerAspects.eventExecution",
          },
          valueForMoney: {
            $avg: "$organizerAspects.valueForMoney",
          },
        },
      },
      {
        $project: {
          _id: 0,
          communication: { $round: ["$communication", 2] },
          professionalism: { $round: ["$professionalism", 2] },
          eventExecution: { $round: ["$eventExecution", 2] },
          valueForMoney: { $round: ["$valueForMoney", 2] },
        },
      },
    ]);

    if (!aspects.length) {
      return {
        communication: null,
        professionalism: null,
        eventExecution: null,
        valueForMoney: null,
      };
    }

    return aspects[0];
  } catch (error) {
    console.error("Error calculating organizer aspect ratings:", error);
    return {
      communication: null,
      professionalism: null,
      eventExecution: null,
      valueForMoney: null,
    };
  }
};

/**
 * Check if user attended event (has valid ticket)
 */
exports.didUserAttendEvent = async (userId, eventId) => {
  try {
    const ticket = await Ticket.findOne({
      buyer: userId,
      event: eventId,
      status: { $in: ["valid", "used", "scanned"] },
    }).lean();

    return !!ticket;
  } catch (error) {
    console.error("Error checking attendance:", error);
    return false;
  }
};

/**
 * Check if user already reviewed target
 */
exports.hasUserReviewed = async (userId, targetType, targetId) => {
  try {
    const mongoose = require("mongoose");
    const existing = await Rating.findOne({
      reviewer: userId,
      targetType,
      targetId: mongoose.Types.ObjectId(targetId),
    }).lean();

    return !!existing;
  } catch (error) {
    console.error("Error checking existing review:", error);
    return false;
  }
};

/**
 * Flag/hide a review due to moderation
 */
exports.flagReview = async (reviewId, reason) => {
  try {
    const rating = await Rating.findByIdAndUpdate(
      reviewId,
      {
        isVisible: false,
        flaggedAt: new Date(),
        flagReason: reason,
      },
      { new: true }
    );

    return rating;
  } catch (error) {
    console.error("Error flagging review:", error);
    return null;
  }
};
