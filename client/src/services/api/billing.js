import API from "../../api/axios";

export const getCurrentPlan = () => API.get("/billing/current-plan");
export const getBillingHistory = () => API.get("/billing/history");
export const upgradePlan = (payload) => API.post("/billing/upgrade", payload);
