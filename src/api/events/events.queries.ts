import { queryOptions } from "@tanstack/react-query";
import { fetchEvents } from "./events.service";

export const eventKeys = {
  all: ["events"] as const,
  list: (limit: number) => [...eventKeys.all, "list", limit] as const,
};

export const eventQueries = {
  list: (limit = 60) =>
    queryOptions({ queryKey: eventKeys.list(limit), queryFn: () => fetchEvents(limit) }),
};
