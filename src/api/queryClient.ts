import { QueryClient } from "@tanstack/react-query";

/** The app's one query cache. Short staleTime: navigating back reuses data, focus refetches. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
