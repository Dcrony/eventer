import API from "../../api/axios";

export const fetchPosts = () => API.get("/posts");
export const createPost = (content) => API.post("/posts", { content });
export const toggleLikePost = (postId) => API.post(`/posts/${postId}/like`);
export const addComment = (postId, content) =>
  API.post(`/posts/${postId}/comments`, { content });
