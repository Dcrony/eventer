import axios from "../api/axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const ADMIN_API = `${API_URL}/admin`;

const downloadBlob = async (url) => {
  const response = await axios.get(url, { responseType: "blob" });
  return response.data;
};

const adminService = {
  getPlatformStats: async () => {
    const response = await axios.get(`${ADMIN_API}/stats`);
    return response.data;
  },

  getRevenueAnalytics: async (filters = {}) => {
    const response = await axios.get(`${ADMIN_API}/revenue`, { params: filters });
    return response.data;
  },

  getPlatformMetrics: async () => {
    const response = await axios.get(`${ADMIN_API}/metrics`);
    return response.data;
  },

  getAllUsers: async (page = 1, limit = 20, filters = {}) => {
    const response = await axios.get(`${ADMIN_API}/users`, {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  getUserDetails: async (userId) => {
    const response = await axios.get(`${ADMIN_API}/users/${userId}`);
    return response.data;
  },

  suspendUser: async (userId) => {
    const response = await axios.patch(`${ADMIN_API}/users/${userId}/status`, { suspend: true });
    return response.data;
  },

  reactivateUser: async (userId) => {
    const response = await axios.patch(`${ADMIN_API}/users/${userId}/status`, { suspend: false });
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await axios.patch(`${ADMIN_API}/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await axios.delete(`${ADMIN_API}/users/${userId}`);
    return response.data;
  },

  getAllEvents: async (page = 1, limit = 20, filters = {}) => {
    const response = await axios.get(`${ADMIN_API}/events`, {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  approveEvent: async (eventId, reason = "") => {
    const response = await axios.patch(`${ADMIN_API}/events/${eventId}/status`, {
      status: "approved",
      reason,
    });
    return response.data;
  },

  rejectEvent: async (eventId, reason = "") => {
    const response = await axios.patch(`${ADMIN_API}/events/${eventId}/status`, {
      status: "rejected",
      reason,
    });
    return response.data;
  },

  toggleEventFeatured: async (eventId) => {
    const response = await axios.patch(`${ADMIN_API}/events/${eventId}/featured`);
    return response.data;
  },

  getTransactions: async (page = 1, limit = 20, filters = {}) => {
    const response = await axios.get(`${ADMIN_API}/transactions`, {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  exportTransactions: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return downloadBlob(`${ADMIN_API}/transactions/export${params ? `?${params}` : ""}`);
  },

  getWithdrawals: async (page = 1, limit = 20, filters = {}) => {
    const response = await axios.get(`${API_URL}/admin/withdrawals`, {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  getWithdrawalAnalytics: async () => {
    const response = await axios.get(`${API_URL}/admin/withdrawals/analytics`);
    return response.data;
  },

  getWithdrawalMonthlyTrend: async () => {
    const response = await axios.get(`${API_URL}/admin/withdrawals/monthly`);
    return response.data;
  },

  updateWithdrawalStatus: async (withdrawalId, status, reason = "") => {
    const response = await axios.patch(`${API_URL}/admin/withdrawals/${withdrawalId}`, {
      status,
      reason,
    });
    return response.data;
  },

  exportWithdrawals: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return downloadBlob(`${API_URL}/admin/withdrawals/export${params ? `?${params}` : ""}`);
  },

  getActivityLogs: async (page = 1, limit = 50, filters = {}) => {
    const response = await axios.get(`${ADMIN_API}/logs`, {
      params: { page, limit, ...filters },
    });
    return response.data;
  },

  sendAnnouncement: async (announcement) => {
    const response = await axios.post(`${ADMIN_API}/announcement`, announcement);
    return response.data;
  },
};

export default adminService;
