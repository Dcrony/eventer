import API from "../../api/axios";

export const submitVerification = (formData) => API.post(`/verification/submit`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
});

export const getMyVerification = () => API.get(`/verification/me`);

export const adminListVerifications = (params) => API.get(`/verification/admin/queue`, { params });

export const adminReviewVerification = (id, action, reason) =>
  API.post(`/verification/admin/${id}/review`, { action, reason });

export const getVerificationById = (id) => API.get(`/verification/admin/${id}`);

export const adminRequestResubmission = (id, instructions) =>
  API.patch(`/verification/admin/${id}/resubmit`, { instructions });

export const adminSuspendVerification = (id, reason, investigationNotes) =>
  API.patch(`/verification/admin/${id}/suspend`, { reason, investigationNotes });

export const getVerificationAuditHistory = (id) =>
  API.get(`/verification/admin/${id}/audit-history`);

export default {
  submitVerification,
  getMyVerification,
  adminListVerifications,
  adminReviewVerification,
  getVerificationById,
  adminRequestResubmission,
  adminSuspendVerification,
  getVerificationAuditHistory,
};
