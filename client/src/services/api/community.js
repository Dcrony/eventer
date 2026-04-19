import API from "../../api/axios";

export const getCommunityPosts = () => API.get("/community");
export const createCommunityPost = (payload) => API.post("/community", payload);
export const toggleCommunityPostLike = (postId) => API.post(`/community/${postId}/like`);
export const addCommunityComment = (postId, payload) =>
  API.post(`/community/${postId}/comments`, payload);
