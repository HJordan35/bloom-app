import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { eventKeys } from "../events/events.queries";
import { queryClient } from "../queryClient";
import { rankingKeys } from "../rankings/rankings.queries";
import { createRoast, fetchRoast, fetchRoasts, uploadRoastPhoto } from "./roasts.service";

export const roastKeys = {
  all: ["roasts"] as const,
  list: () => [...roastKeys.all, "list"] as const,
  detail: (id: string) => [...roastKeys.all, "detail", id] as const,
};

export const roastQueries = {
  list: () => queryOptions({ queryKey: roastKeys.list(), queryFn: fetchRoasts }),
  detail: (id: string) =>
    queryOptions({ queryKey: roastKeys.detail(id), queryFn: () => fetchRoast(id) }),
};

/** Refresh every roast query, e.g. when Realtime reports a studio photo finished. */
export function invalidateRoasts() {
  return queryClient.invalidateQueries({ queryKey: roastKeys.all });
}

export const roastMutations = {
  create: () =>
    mutationOptions({
      mutationFn: createRoast,
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: roastKeys.all }),
          queryClient.invalidateQueries({ queryKey: rankingKeys.all }),
          queryClient.invalidateQueries({ queryKey: eventKeys.all }),
        ]),
    }),
  uploadPhoto: () =>
    mutationOptions({
      mutationFn: ({ roastId, file }: { roastId: string; file: File }) =>
        uploadRoastPhoto(roastId, file),
      onSuccess: invalidateRoasts,
    }),
};
