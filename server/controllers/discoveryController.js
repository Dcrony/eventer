/**
 * Discovery Controller
 * Handles personalized event recommendations and discovery endpoints
 */

const discoveryService = require("../services/discoveryService");

/**
 * GET /api/discovery/feed
 * Get personalized event feed based on user interests
 */
exports.getDiscoveryFeed = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    const userId = req.user._id;

    const events = await discoveryService.getDiscoveryFeed(
      userId,
      parseInt(limit),
      parseInt(skip)
    );

    res.json({
      success: true,
      events,
      pagination: { limit: parseInt(limit), skip: parseInt(skip) },
    });
  } catch (error) {
    console.error("Error in getDiscoveryFeed:", error);
    res.status(500).json({ success: false, message: "Failed to fetch discovery feed" });
  }
};

/**
 * GET /api/discovery/recommendations
 * Get personalized event recommendations
 */
exports.getRecommendations = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;
    const userId = req.user._id;

    const events = await discoveryService.getPersonalizedRecommendations(
      userId,
      parseInt(limit),
      parseInt(skip)
    );

    res.json({ success: true, events });
  } catch (error) {
    console.error("Error in getRecommendations:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recommendations" });
  }
};

/**
 * GET /api/discovery/trending
 * Get trending events (public, no auth required)
 */
exports.getTrendingEvents = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    const events = await discoveryService.getTrendingEvents(
      parseInt(limit),
      parseInt(skip)
    );

    res.json({ success: true, events });
  } catch (error) {
    console.error("Error in getTrendingEvents:", error);
    res.status(500).json({ success: false, message: "Failed to fetch trending events" });
  }
};

/**
 * GET /api/discovery/featured
 * Get featured events (public, no auth required)
 */
exports.getFeaturedEvents = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    const events = await discoveryService.getFeaturedEvents(
      parseInt(limit),
      parseInt(skip)
    );

    res.json({ success: true, events });
  } catch (error) {
    console.error("Error in getFeaturedEvents:", error);
    res.status(500).json({ success: false, message: "Failed to fetch featured events" });
  }
};

/**
 * GET /api/discovery/nearby
 * Get nearby events based on user location
 */
exports.getNearbyEvents = async (req, res) => {
  try {
    const { location, limit = 10, skip = 0 } = req.query;
    const userId = req.user._id;

    if (!location) {
      const user = require("../models/User");
      const userData = await user.findById(userId);
      location = userData?.location || "";
    }

    const events = await discoveryService.getNearbyEvents(
      location,
      parseInt(limit),
      parseInt(skip)
    );

    res.json({ success: true, events, location });
  } catch (error) {
    console.error("Error in getNearbyEvents:", error);
    res.status(500).json({ success: false, message: "Failed to fetch nearby events" });
  }
};

/**
 * GET /api/discovery/search-suggestions
 * Get search suggestions based on interests + query
 */
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query = "", limit = 5 } = req.query;
    const userId = req.user._id;

    const suggestions = await discoveryService.getSearchSuggestions(
      userId,
      query,
      parseInt(limit)
    );

    res.json({ success: true, suggestions });
  } catch (error) {
    console.error("Error in getSearchSuggestions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch suggestions" });
  }
};

/**
 * POST /api/discovery/interests
 * Update user interests from onboarding
 */
exports.updateInterests = async (req, res) => {
  try {
    const { interests = [] } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        message: "Interests must be an array",
      });
    }

    const updated = await discoveryService.updateUserInterests(userId, interests);

    res.json({
      success: true,
      message: "Interests updated successfully",
      user: {
        _id: updated._id,
        interests: updated.interests,
        interestsSelected: updated.interestsSelected,
      },
    });
  } catch (error) {
    console.error("Error in updateInterests:", error);
    res.status(500).json({ success: false, message: "Failed to update interests" });
  }
};

/**
 * GET /api/discovery/organizer/:organizerId/featured
 * Get featured events for an organizer profile (public endpoint)
 */
exports.getOrganizerFeaturedEvents = async (req, res) => {
  try {
    const { organizerId } = req.params;

    const featuredEvents = await discoveryService.getOrganizerFeaturedEvents(organizerId);

    res.json({
      success: true,
      featured: featuredEvents,
    });
  } catch (error) {
    console.error("Error in getOrganizerFeaturedEvents:", error);
    res.status(500).json({ success: false, message: "Failed to fetch organizer featured events" });
  }
};
