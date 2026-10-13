import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { broQueries } from "../../api/bros/bros.queries";
import { reportMutations, reportQueries } from "../../api/reports/reports.queries";
import { EmptyState } from "../../components/EmptyState";
import { useCurrentBro } from "../../lib/auth";
import { monthTitle } from "../../lib/format";
import { ReportView } from "./ReportView";

const TREND_MONTHS = 6;

/** "2026-09" and the months before it, oldest first. */
function trailingMonths(month: string, count: number) {
  const [year, m] = month.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(year, m - count + i);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

export function ReportPage() {
  const { month = "" } = useParams();
  const me = useCurrentBro();
  const history = useQueries({
    queries: trailingMonths(month, TREND_MONTHS).map((m) => reportQueries.stats(m)),
  });
  const { data: insights } = useQuery(reportQueries.insights(month));
  const { data: newRoasts } = useQuery(reportQueries.newRoasts(month));
  const { data: showcase } = useQuery(reportQueries.showcase(month));
  const { data: roastInsights } = useQuery(reportQueries.roastInsights(month));
  const { data: bros } = useQuery(broQueries.list());

  // Opening the report marks it read, which clears the top bar's badge
  const { mutate: markViewed } = useMutation(reportMutations.markViewed());
  useEffect(() => markViewed({ broId: me.id, month }), [markViewed, me.id, month]);

  const months = history.map((q) => q.data);
  if (
    !months.every((m) => m != null) ||
    !insights ||
    !newRoasts ||
    !roastInsights ||
    showcase === undefined ||
    !bros
  )
    return null;
  const stats = months[months.length - 1];

  if (stats.totals.brews === 0 && insights.size === 0) {
    return <EmptyState title={`No report for ${monthTitle(month)}.`} />;
  }

  // Trends start at the first month with any brews, not a run of zeros before the app was used
  const first = months.findIndex((m) => m.totals.brews > 0);

  return (
    <ReportView
      month={month}
      stats={stats}
      history={months.slice(Math.max(0, first))}
      insights={insights}
      newRoasts={newRoasts}
      roastInsights={roastInsights}
      showcase={showcase}
      bros={bros}
      meId={me.id}
    />
  );
}
