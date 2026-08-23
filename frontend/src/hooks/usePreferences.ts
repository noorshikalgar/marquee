import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

interface Preference {
  id: number;
  prefType: "genre" | "person" | "keyword" | "origin_country";
  value: string;
  weight: number;
}

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => api.get<Preference[]>("/preferences"),
  });
}
