/**
 * Discovery Routes
 * Personalized event recommendations and discovery endpoints
 */

const express = require("express");
const discoveryController = require("../controllers/discoveryController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes (no auth required)
router.get("/trending", discoveryController.getTrendingEvents);
router.get("/featured", discoveryController.getFeaturedEvents);

// Organizer featured events (public)
router.get("/organizer/:organizerId/featured", discoveryController.getOrganizerFeaturedEvents);

// Auth-required routes
router.get("/feed", authMiddleware, discoveryController.getDiscoveryFeed);
router.get("/recommendations", authMiddleware, discoveryController.getRecommendations);
router.get("/nearby", authMiddleware, discoveryController.getNearbyEvents);
router.get("/search-suggestions", authMiddleware, discoveryController.getSearchSuggestions);

// Update user interests from onboarding
router.post("/interests", authMiddleware, discoveryController.updateInterests);

module.exports = router;
