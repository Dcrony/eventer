import API from "../../api/axios";

/**
 * Rating/Review API service
 */

export const submitReview = (data) =>
  API.post("/ratings/submit", data);

export const getReviews = (targetType, targetId, limit = 5, skip = 0) =>
  API.get("/ratings/list", {
    params: { targetType, targetId, limit, skip },
  });

export const getRatingStats = (targetType, targetId) =>
  API.get("/ratings/stats", {
    params: { targetType, targetId },
  });

export const getOrganizerReputation = (organizerId) =>
  API.get(`/ratings/organizer/${organizerId}/reputation`);

export const submitReport = (data) =>
  API.post("/ratings/report", data);

export const markReviewHelpful = (reviewId, helpful = true) =>
  API.post(`/ratings/${reviewId}/helpful`, { helpful });

export const adminGetReports = (status = "open", limit = 20, skip = 0) =>
  API.get("/ratings/admin/reports", {
    params: { status, limit, skip },
  });

export const adminResolveReport = (reportId, data) =>
  API.post(`/ratings/admin/report/${reportId}/resolve`, data);

export default {
  submitReview,
  getReviews,
  getRatingStats,
  getOrganizerReputation,
  submitReport,
  markReviewHelpful,
  adminGetReports,
  adminResolveReport,
};
