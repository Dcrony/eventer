export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
export const PORT_URL = API_URL.replace(/\/api\/?$/, "");