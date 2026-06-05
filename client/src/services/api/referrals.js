import API from "../../api/axios";

export const getEventReferralStats = (eventId) => API.get(`/referrals/${eventId}/stats`).then((r) => r.data);
export const getReferralLeaderboard = (eventId) => API.get(`/referrals/${eventId}/leaderboard`).then((r) => r.data);

export default { getEventReferralStats, getReferralLeaderboard };
