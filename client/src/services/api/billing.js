import API from "../../api/axios";

export const getCurrentPlan = () => API.get("/billing/current-plan");
export const getBillingHistory = () => API.get("/billing/history");
export const initializeBilling = (payload) => API.post("/billing/initialize", payload);
export const verifyBilling = (reference) => API.get(`/billing/verify/${reference}`);
export const upgradePlan = (payload) => API.post("/billing/upgrade", payload);
