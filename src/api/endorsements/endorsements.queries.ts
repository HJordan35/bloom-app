import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { eventKeys } from "../events/events.queries";
import { queryClient } from "../queryClient";
import { rankingKeys } from "../rankings/rankings.queries";
import { createEndorsement, fetchEndorsements, updateEndorsement } from "./endorsements.service";
import type { EndorsementFilter, EndorsementUpdate } from "./endorsements.types";

export const endorsementKeys = {
  all: ["endorsements"] as const,
  list: (filter: EndorsementFilter) => [...endorsementKeys.all, "list", filter] as const,
};

export const endorsementQueries = {
  list: (filter: EndorsementFilter) =>
    queryOptions({
      queryKey: endorsementKeys.list(filter),
      queryFn: () => fetchEndorsements(filter),
    }),
};

/** Ratings feed the rankings and events views, so those refresh too. */
export function invalidateEndorsements() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: endorsementKeys.all }),
    queryClient.invalidateQueries({ queryKey: rankingKeys.all }),
    queryClient.invalidateQueries({ queryKey: eventKeys.all }),
  ]);
}

export const endorsementMutations = {
  create: () =>
    mutationOptions({ mutationFn: createEndorsement, onSuccess: invalidateEndorsements }),
  update: () =>
    mutationOptions({
      mutationFn: ({ id, fields }: { id: string; fields: EndorsementUpdate }) =>
        updateEndorsement(id, fields),
      onSuccess: invalidateEndorsements,
    }),
};
