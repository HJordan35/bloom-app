import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient } from "../queryClient";
import { deleteCoachChat, fetchCoachChat, fetchCoachChats } from "./coach.service";

export const coachKeys = {
  all: ["coach"] as const,
  chat: (id: string) => [...coachKeys.all, "chat", id] as const,
  list: () => [...coachKeys.all, "list"] as const,
};

export const coachQueries = {
  /** Fetched afresh each time the coach opens. */
  list: () =>
    queryOptions({ queryKey: coachKeys.list(), queryFn: fetchCoachChats, staleTime: 0, gcTime: 0 }),
  /** Never cached: reopening the coach shows what the server last saved. */
  chat: (id: string) =>
    queryOptions({
      queryKey: coachKeys.chat(id),
      queryFn: () => fetchCoachChat(id),
      staleTime: 0,
      gcTime: 0,
    }),
};

export const coachMutations = {
  remove: () =>
    mutationOptions({
      mutationFn: deleteCoachChat,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: coachKeys.list() }),
    }),
};
