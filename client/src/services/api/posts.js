import API from "../../api/axios";

export const getPosts = () => API.get("/posts");
export const createPost = (payload) => API.post("/posts", payload);
export const likePost = (postId) => API.post(`/posts/${postId}/like`);
export const commentOnPost = (postId, payload) => API.post(`/posts/${postId}/comments`, payload);
export const getPostComments = (postId) => API.get(`/comments/${postId}`);
export const createComment = (payload) => API.post("/comments", payload);
