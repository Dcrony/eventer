import API from "../../api/axios";

export const submitVerification = (formData) => API.post(`/verification/submit`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
});

export const getMyVerification = () => API.get(`/verification/me`);

export const adminListVerifications = (params) => API.get(`/verification/admin/queue`, { params });

export const adminReviewVerification = (id, action, reason) =>
  API.post(`/verification/admin/${id}/review`, { action, reason });

export const getVerificationById = (id) => API.get(`/verification/admin/${id}`);

export default { submitVerification, getMyVerification, adminListVerifications, adminReviewVerification, getVerificationById };
