import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient } from "../queryClient";
import {
  fetchInsights,
  fetchMonthlyStats,
  fetchNewRoasts,
  fetchReportMonths,
  fetchReportViews,
  fetchRoastInsights,
  fetchShowcase,
  markReportViewed,
} from "./reports.service";

export const reportKeys = {
  all: ["reports"] as const,
  months: () => [...reportKeys.all, "months"] as const,
  views: () => [...reportKeys.all, "views"] as const,
  stats: (month: string) => [...reportKeys.all, "stats", month] as const,
  insights: (month: string) => [...reportKeys.all, "insights", month] as const,
  newRoasts: (month: string) => [...reportKeys.all, "newRoasts", month] as const,
  showcase: (month: string) => [...reportKeys.all, "showcase", month] as const,
  roastInsights: (month: string) => [...reportKeys.all, "roastInsights", month] as const,
};

/** A Brewsletter was published: refresh the list and the unread badge. */
export function invalidateReportMonths() {
  return queryClient.invalidateQueries({ queryKey: reportKeys.months() });
}

export const reportQueries = {
  months: () => queryOptions({ queryKey: reportKeys.months(), queryFn: fetchReportMonths }),
  views: () => queryOptions({ queryKey: reportKeys.views(), queryFn: fetchReportViews }),
  stats: (month: string) =>
    queryOptions({ queryKey: reportKeys.stats(month), queryFn: () => fetchMonthlyStats(month) }),
  insights: (month: string) =>
    queryOptions({ queryKey: reportKeys.insights(month), queryFn: () => fetchInsights(month) }),
  newRoasts: (month: string) =>
    queryOptions({ queryKey: reportKeys.newRoasts(month), queryFn: () => fetchNewRoasts(month) }),
  showcase: (month: string) =>
    queryOptions({ queryKey: reportKeys.showcase(month), queryFn: () => fetchShowcase(month) }),
  roastInsights: (month: string) =>
    queryOptions({
      queryKey: reportKeys.roastInsights(month),
      queryFn: () => fetchRoastInsights(month),
    }),
};

export const reportMutations = {
  /** Adds the month to the cached views as well, so the unread badge clears at once. */
  markViewed: () =>
    mutationOptions({
      mutationFn: markReportViewed,
      onSuccess: (_, { month }) =>
        queryClient.setQueryData(reportQueries.views().queryKey, (views = []) =>
          views.includes(month) ? views : [...views, month],
        ),
    }),
};
