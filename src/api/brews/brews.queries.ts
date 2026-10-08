import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { eventKeys } from "../events/events.queries";
import { queryClient } from "../queryClient";
import { rankingKeys } from "../rankings/rankings.queries";
import {
  discardBrew,
  fetchBrew,
  fetchBrewingNow,
  fetchBrewsForRoast,
  fetchBrewsForRoaster,
  fetchBroBrews,
  fetchLastRecipe,
  fetchMyBrewHistory,
  fetchMyOpenBrew,
  fetchRecentBrews,
  finishBrew,
  startBrew,
  updateBrew,
} from "./brews.service";
import type { BrewProcess, BrewUpdate } from "./brews.types";

export const brewKeys = {
  all: ["brews"] as const,
  detail: (id: string) => [...brewKeys.all, "detail", id] as const,
  myOpen: (broId: string) => [...brewKeys.all, "myOpen", broId] as const,
  brewingNow: () => [...brewKeys.all, "brewingNow"] as const,
  recent: (broId: string) => [...brewKeys.all, "recent", broId] as const,
  forRoast: (roastId: string) => [...brewKeys.all, "forRoast", roastId] as const,
  forRoaster: (roasterId: string) => [...brewKeys.all, "forRoaster", roasterId] as const,
  forBro: (broId: string) => [...brewKeys.all, "forBro", broId] as const,
  lastRecipe: (broId: string, roastId: string, method: string) =>
    [...brewKeys.all, "lastRecipe", broId, roastId, method] as const,
  history: (broId: string) => [...brewKeys.all, "history", broId] as const,
};

export const brewQueries = {
  detail: (id: string) =>
    queryOptions({ queryKey: brewKeys.detail(id), queryFn: () => fetchBrew(id) }),
  myOpen: (broId: string) =>
    queryOptions({ queryKey: brewKeys.myOpen(broId), queryFn: () => fetchMyOpenBrew(broId) }),
  brewingNow: () => queryOptions({ queryKey: brewKeys.brewingNow(), queryFn: fetchBrewingNow }),
  /** Other bros' live brews: shares the brewingNow request and cache entry. */
  live: (broId: string) =>
    queryOptions({
      ...brewQueries.brewingNow(),
      select: (brews) => brews.filter((b) => b.bro_id !== broId),
    }),
  recent: (broId: string) =>
    queryOptions({ queryKey: brewKeys.recent(broId), queryFn: () => fetchRecentBrews(broId) }),
  forRoast: (roastId: string) =>
    queryOptions({
      queryKey: brewKeys.forRoast(roastId),
      queryFn: () => fetchBrewsForRoast(roastId),
    }),
  forRoaster: (roasterId: string) =>
    queryOptions({
      queryKey: brewKeys.forRoaster(roasterId),
      queryFn: () => fetchBrewsForRoaster(roasterId),
    }),
  forBro: (broId: string) =>
    queryOptions({ queryKey: brewKeys.forBro(broId), queryFn: () => fetchBroBrews(broId) }),
  lastRecipe: (broId: string, roastId: string, method: string) =>
    queryOptions({
      queryKey: brewKeys.lastRecipe(broId, roastId, method),
      queryFn: () => fetchLastRecipe(broId, roastId, method),
    }),
  history: (broId: string) =>
    queryOptions({ queryKey: brewKeys.history(broId), queryFn: () => fetchMyBrewHistory(broId) }),
};

/** Brews feed the rankings and events views, so those refresh too. */
export function invalidateBrews() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: brewKeys.all }),
    queryClient.invalidateQueries({ queryKey: rankingKeys.all }),
    queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  ]);
}

export const brewMutations = {
  start: () => mutationOptions({ mutationFn: startBrew, onSuccess: invalidateBrews }),
  update: () =>
    mutationOptions({
      mutationFn: ({ id, fields }: { id: string; fields: BrewUpdate }) => updateBrew(id, fields),
      onSuccess: invalidateBrews,
    }),
  finish: () =>
    mutationOptions({
      mutationFn: ({ id, process }: { id: string; process: BrewProcess }) =>
        finishBrew(id, process),
      onSuccess: invalidateBrews,
    }),
  discard: () => mutationOptions({ mutationFn: discardBrew, onSuccess: invalidateBrews }),
};
