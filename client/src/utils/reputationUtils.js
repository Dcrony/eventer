/**
 * Reputation/Review Integration Utilities
 * Helper functions for integrating reviews across the platform
 */

import {
  getRatingStats,
  getReviews as fetchReviews,
  getOrganizerReputation,
  submitReport,
} from "../services/api/ratings";

/**
 * Load event rating stats
 */
export async function loadEventRatings(eventId) {
  try {
    const { data } = await getRatingStats("event", eventId);
    return data.stats;
  } catch (error) {
    console.error("Failed to load event ratings:", error);
    return { averageRating: 0, totalRatings: 0, ratingCounts: {} };
  }
}

/**
 * Load event reviews/comments
 */
export async function loadEventReviews(eventId, limit = 5, skip = 0) {
  try {
    const { data } = await fetchReviews("event", eventId, limit, skip);
    return { reviews: data.reviews, pagination: data.pagination };
  } catch (error) {
    console.error("Failed to load event reviews:", error);
    return { reviews: [], pagination: { limit, skip, total: 0 } };
  }
}

/**
 * Load organizer trust score and ratings
 */
export async function loadOrganizerReputation(organizerId) {
  try {
    const { data } = await getOrganizerReputation(organizerId);
    return data.reputation;
  } catch (error) {
    console.error("Failed to load organizer reputation:", error);
    return null;
  }
}

/**
 * Report an event or organizer
 */
export async function reportTarget(targetType, targetId, reason, description, eventId = null) {
  try {
    const { data } = await submitReport({
      targetType,
      targetId,
      reason,
      description,
      eventId,
    });
    return { success: true, data: data.report };
  } catch (error) {
    console.error("Failed to submit report:", error);
    throw error;
  }
}

/**
 * Format trust level based on score
 */
export function getTrustLevel(trustScore) {
  if (trustScore >= 80) return { level: "Excellent", color: "text-green-600", bg: "bg-green-50" };
  if (trustScore >= 60) return { level: "Good", color: "text-blue-600", bg: "bg-blue-50" };
  if (trustScore >= 40) return { level: "Fair", color: "text-yellow-600", bg: "bg-yellow-50" };
  return { level: "New", color: "text-gray-600", bg: "bg-gray-50" };
}

/**
 * Format average rating with visual representation
 */
export function formatRating(rating) {
  if (!rating) return { stars: 0, label: "No ratings" };

  const rounded = Math.round(rating * 2) / 2;
  let label = "";

  if (rounded >= 4.5) label = "Excellent";
  else if (rounded >= 4) label = "Very good";
  else if (rounded >= 3) label = "Good";
  else if (rounded >= 2) label = "Fair";
  else label = "Poor";

  return { stars: rounded, label };
}
