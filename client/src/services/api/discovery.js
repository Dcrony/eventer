import API from "../axios";

/**
 * Discovery API Service
 * Handles all personalized event recommendations and discovery endpoints
 */

export const getDiscoveryFeed = async (limit = 10, skip = 0) => {
  return API.get("/discovery/feed", {
    params: { limit, skip },
  });
};

export const getRecommendations = async (limit = 10, skip = 0) => {
  return API.get("/discovery/recommendations", {
    params: { limit, skip },
  });
};

export const getTrendingEvents = async (limit = 10, skip = 0) => {
  return API.get("/discovery/trending", {
    params: { limit, skip },
  });
};

export const getFeaturedEvents = async (limit = 10, skip = 0) => {
  return API.get("/discovery/featured", {
    params: { limit, skip },
  });
};

export const getNearbyEvents = async (location = "", limit = 10, skip = 0) => {
  return API.get("/discovery/nearby", {
    params: { location, limit, skip },
  });
};

export const getSearchSuggestions = async (query = "", limit = 5) => {
  return API.get("/discovery/search-suggestions", {
    params: { query, limit },
  });
};

export const updateInterests = async (interests = []) => {
  return API.post("/discovery/interests", { interests });
};

export const getOrganizerFeaturedEvents = async (organizerId) => {
  return API.get(`/discovery/organizer/${organizerId}/featured`);
};
