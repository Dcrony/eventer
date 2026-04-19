import API from "../../api/axios";

export const getCreators = (params = {}) => API.get("/users/creators", { params });
