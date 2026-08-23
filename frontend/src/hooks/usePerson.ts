import type { PersonDetail } from "@movie-scout/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export function usePerson(personId: number) {
  return useQuery({
    queryKey: ["person", personId],
    queryFn: () => api.get<PersonDetail>(`/people/${personId}`),
    enabled: !!personId,
  });
}
