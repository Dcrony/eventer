/**
 * Personalized Discovery Service
 * Powers recommendations based on user interests with intelligent fallbacks
 */

const Event = require("../models/Event");
const User = require("../models/User");

/**
 * Get personalized event recommendations for a user
 * Strategy: Interest matching → Trending → Nearby → Featured
 */
exports.getPersonalizedRecommendations = async (userId, limit = 10, skip = 0) => {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    // Priority 1: Match user interests to event categories
    if (user.interests && user.interests.length > 0) {
      const interestMatches = await Event.find({
        category: { $in: user.interests },
        isDraft: false,
        status: { $ne: "cancelled" },
      })
        .sort({ startDate: 1, likeCount: -1 })
        .limit(limit)
        .skip(skip);

      if (interestMatches.length > 0) {
        return interestMatches;
      }
    }

    // Fallback 1: Trending events (most liked/shared recently)
    const trendingEvents = await Event.find({
      isDraft: false,
      status: { $ne: "cancelled" },
      startDate: { $gte: new Date() },
    })
      .sort({ likeCount: -1, shareCount: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return trendingEvents;
  } catch (error) {
    console.error("Error in getPersonalizedRecommendations:", error);
    return [];
  }
};

/**
 * Get nearby events based on user location
 */
exports.getNearbyEvents = async (userLocation, limit = 10, skip = 0) => {
  try {
    if (!userLocation || userLocation === "Tickispot") {
      // No valid location, return empty
      return [];
    }

    const nearbyEvents = await Event.find({
      location: { $regex: userLocation, $options: "i" },
      isDraft: false,
      status: { $ne: "cancelled" },
      startDate: { $gte: new Date() },
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .skip(skip);

    return nearbyEvents;
  } catch (error) {
    console.error("Error in getNearbyEvents:", error);
    return [];
  }
};

/**
 * Get trending events (no user context needed)
 */
exports.getTrendingEvents = async (limit = 10, skip = 0) => {
  try {
    const trendingEvents = await Event.find({
      isDraft: false,
      status: { $ne: "cancelled" },
    })
      .sort({ likeCount: -1, ticketsSold: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return trendingEvents;
  } catch (error) {
    console.error("Error in getTrendingEvents:", error);
    return [];
  }
};

/**
 * Get featured events (hand-curated or promoted)
 */
exports.getFeaturedEvents = async (limit = 10, skip = 0) => {
  try {
    const featuredEvents = await Event.find({
      isFeatured: true,
      isDraft: false,
      status: { $ne: "cancelled" },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return featuredEvents;
  } catch (error) {
    console.error("Error in getFeaturedEvents:", error);
    return [];
  }
};

/**
 * Get combined recommendations with fallback strategy
 */
exports.getDiscoveryFeed = async (userId, limit = 10, skip = 0) => {
  try {
    // Get personalized recommendations (includes fallback to trending)
    const recommendations = await exports.getPersonalizedRecommendations(userId, limit, skip);

    // If recommendations are sparse, enhance with featured/trending
    if (recommendations.length < limit / 2) {
      const featured = await exports.getFeaturedEvents(limit, 0);
      const combined = [
        ...recommendations,
        ...featured.filter(f => !recommendations.find(r => r._id.toString() === f._id.toString())),
      ].slice(0, limit);

      return combined;
    }

    return recommendations;
  } catch (error) {
    console.error("Error in getDiscoveryFeed:", error);
    return [];
  }
};

/**
 * Get organizer featured events (created + collaborations)
 */
exports.getOrganizerFeaturedEvents = async (organizerId) => {
  try {
    // Get events created by organizer
    const createdEvents = await Event.find({
      createdBy: organizerId,
      isDraft: false,
    })
      .sort({ startDate: -1 })
      .limit(10);

    // Get events where organizer is team member
    const collaboratorEvents = await Event.find({
      "team.user": organizerId,
      isDraft: false,
    })
      .sort({ startDate: -1 })
      .limit(10);

    return {
      created: createdEvents,
      collaborator: collaboratorEvents,
    };
  } catch (error) {
    console.error("Error in getOrganizerFeaturedEvents:", error);
    return { created: [], collaborator: [] };
  }
};

/**
 * Update user interests from onboarding selection
 */
exports.updateUserInterests = async (userId, interests = []) => {
  try {
    const updated = await User.findByIdAndUpdate(
      userId,
      {
        interests: Array.isArray(interests) ? interests : [],
        interestsSelected: true,
      },
      { new: true }
    );
    return updated;
  } catch (error) {
    console.error("Error in updateUserInterests:", error);
    return null;
  }
};

/**
 * Get search suggestions based on user interests + trending
 */
exports.getSearchSuggestions = async (userId, query = "", limit = 5) => {
  try {
    const user = await User.findById(userId);
    const searchRegex = { $regex: query, $options: "i" };

    // Search in event titles and descriptions
    const suggestions = await Event.find({
      $or: [{ title: searchRegex }, { description: searchRegex }, { category: searchRegex }],
      isDraft: false,
      status: { $ne: "cancelled" },
    })
      .select("_id title category")
      .limit(limit);

    return suggestions;
  } catch (error) {
    console.error("Error in getSearchSuggestions:", error);
    return [];
  }
};
