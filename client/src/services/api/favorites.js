import API from "../../api/axios";

export const toggleFavorite = (eventId) => API.post(`/favorites/${eventId}`);
export const getFavorites = () => API.get("/favorites");
