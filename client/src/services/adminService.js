import axios from "../api/axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const ADMIN_API = `${API_URL}/admin`;

/**
 * Admin API Service
 * Handles all admin dashboard API calls
 */

const adminService = {
  // Dashboard & Analytics
  getPlatformStats: async () => {
    const response = await axios.get(`${ADMIN_API}/stats`);
    return response.data;
  },

  getRevenueAnalytics: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${ADMIN_API}/revenue${params ? `?${params}` : ""}`);
    return response.data;
  },

  getPlatformMetrics: async () => {
    const response = await axios.get(`${ADMIN_API}/metrics`);
    return response.data;
  },

  // User Management
  getAllUsers: async (page = 1, limit = 20, filters = {}) => {
    const params = { page, limit, ...filters };
    const response = await axios.get(`${ADMIN_API}/users`, { params });
    return response.data;
  },

  getUserDetails: async (userId) => {
    const response = await axios.get(`${ADMIN_API}/users/${userId}`);
    return response.data;
  },

  suspendUser: async (userId) => {
    const response = await axios.patch(`${ADMIN_API}/users/${userId}/status`, {
      suspend: true,
    });
    return response.data;
  },

  reactivateUser: async (userId) => {
    const response = await axios.patch(`${ADMIN_API}/users/${userId}/status`, {
      suspend: false,
    });
    return response.data;
  },

  // Event Management
  getAllEvents: async (page = 1, limit = 20, filters = {}) => {
    const params = { page, limit, ...filters };
    const response = await axios.get(`${ADMIN_API}/events`, { params });
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

  // Transactions
  getTransactions: async (page = 1, limit = 20, filters = {}) => {
    const params = { page, limit, ...filters };
    const response = await axios.get(`${ADMIN_API}/transactions`, { params });
    return response.data;
  },

  exportTransactions: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(
      `${ADMIN_API}/transactions/export${params ? `?${params}` : ""}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },

  // Activity Logs
  getActivityLogs: async (page = 1, limit = 50, filters = {}) => {
    const params = { page, limit, ...filters };
    const response = await axios.get(`${ADMIN_API}/logs`, { params });
    return response.data;
  },

  // Platform Control
  sendAnnouncement: async (announcement) => {
    const response = await axios.post(`${ADMIN_API}/announcement`, announcement);
    return response.data;
  },
};

export default adminService;
