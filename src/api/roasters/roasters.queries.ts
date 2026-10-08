import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { eventKeys } from "../events/events.queries";
import { queryClient } from "../queryClient";
import { rankingKeys } from "../rankings/rankings.queries";
import { createRoaster, fetchRoaster, fetchRoasters } from "./roasters.service";

export const roasterKeys = {
  all: ["roasters"] as const,
  list: () => [...roasterKeys.all, "list"] as const,
  detail: (id: string) => [...roasterKeys.all, "detail", id] as const,
};

export const roasterQueries = {
  list: () => queryOptions({ queryKey: roasterKeys.list(), queryFn: fetchRoasters }),
  detail: (id: string) =>
    queryOptions({ queryKey: roasterKeys.detail(id), queryFn: () => fetchRoaster(id) }),
};

/** Roasters feed the rankings and events views, so those refresh too. */
export function invalidateRoasters() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: roasterKeys.all }),
    queryClient.invalidateQueries({ queryKey: rankingKeys.all }),
    queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  ]);
}

export const roasterMutations = {
  create: () => mutationOptions({ mutationFn: createRoaster, onSuccess: invalidateRoasters }),
};
