import API from "../../api/axios";

export const listPayouts = (params) => API.get(`/payouts/admin/queue`, { params }).then(r => r.data);
export const getPayout = (id) => API.get(`/payouts/admin/${id}`).then(r => r.data);
export const getPayoutSettings = () => API.get(`/payouts/admin/settings`).then(r => r.data);
export const updatePayoutSettings = (payload) => API.put(`/payouts/admin/settings`, payload).then(r => r.data);
export const requestEarlyPayout = (payload) => API.post(`/payouts/request`, payload).then(r => r.data);
export const adminAction = (id, action, note) => API.post(`/payouts/admin/${id}/action`, { action, note }).then(r => r.data);
export const processPayouts = (payload) => API.post(`/payouts/admin/process`, payload).then(r => r.data);

export default { listPayouts, getPayout, getPayoutSettings, updatePayoutSettings, requestEarlyPayout, adminAction, processPayouts };
