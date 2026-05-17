import { useQuery } from "@tanstack/react-query";
import API from "../api/axios";

export function usePublicEvents() {
  return useQuery({
    queryKey: ["events", "public"],
    queryFn: async () => {
      const { data } = await API.get("/events");
      return Array.isArray(data) ? data : data?.events || [];
    },
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data } = await API.get("/favorites");
      return Array.isArray(data) ? data : [];
    },
  });
}
