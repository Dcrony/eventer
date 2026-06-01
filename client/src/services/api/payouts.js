import API from "../../api/axios";

export const listPayouts = (params) => API.get(`/payouts/admin/queue`, { params }).then(r => r.data);
export const getPayout = (id) => API.get(`/payouts/admin/${id}`).then(r => r.data);
export const adminAction = (id, action, note) => API.post(`/payouts/admin/${id}/action`, { action, note }).then(r => r.data);

export default { listPayouts, getPayout, adminAction };
