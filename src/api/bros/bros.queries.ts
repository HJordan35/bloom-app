import { queryOptions } from "@tanstack/react-query";
import { fetchBro, fetchBros } from "./bros.service";

export const broKeys = {
  all: ["bros"] as const,
  list: () => [...broKeys.all, "list"] as const,
  detail: (id: string) => [...broKeys.all, "detail", id] as const,
};

export const broQueries = {
  /** Pair with `select: byId` for a lookup map. */
  list: () => queryOptions({ queryKey: broKeys.list(), queryFn: fetchBros }),
  detail: (id: string) =>
    queryOptions({ queryKey: broKeys.detail(id), queryFn: () => fetchBro(id) }),
};
