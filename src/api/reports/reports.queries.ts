import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient } from "../queryClient";
import {
  fetchInsights,
  fetchMonthlyStats,
  fetchReportMonths,
  fetchReportViews,
  markReportViewed,
} from "./reports.service";

export const reportKeys = {
  all: ["reports"] as const,
  months: () => [...reportKeys.all, "months"] as const,
  views: () => [...reportKeys.all, "views"] as const,
  stats: (month: string) => [...reportKeys.all, "stats", month] as const,
  insights: (month: string) => [...reportKeys.all, "insights", month] as const,
};

export const reportQueries = {
  months: () => queryOptions({ queryKey: reportKeys.months(), queryFn: fetchReportMonths }),
  views: () => queryOptions({ queryKey: reportKeys.views(), queryFn: fetchReportViews }),
  stats: (month: string) =>
    queryOptions({ queryKey: reportKeys.stats(month), queryFn: () => fetchMonthlyStats(month) }),
  insights: (month: string) =>
    queryOptions({ queryKey: reportKeys.insights(month), queryFn: () => fetchInsights(month) }),
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
