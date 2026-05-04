import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
});

// Attach auth token; for FormData, omit Content-Type so the browser sets multipart boundary.
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    if (typeof config.headers?.delete === "function") {
      config.headers.delete("Content-Type");
    } else if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const hadToken = Boolean(localStorage.getItem("token"));

    if (status === 401 && hadToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (status === 403 && /deactivated/i.test(String(message || ""))) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    if (
      status === 403 &&
      (error.response?.data?.code === "PLAN_UPGRADE_REQUIRED" ||
        /upgrade to pro/i.test(String(message || "")))
    ) {
      window.dispatchEvent(
        new CustomEvent("planUpgradeRequired", {
          detail: error.response?.data || {},
        }),
      );
    }

    return Promise.reject(error);
  },
);

export default API;

