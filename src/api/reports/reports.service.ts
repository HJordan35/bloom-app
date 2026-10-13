import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import type { Insight, MonthlyStats } from "./reports.types";

// Months are "2026-09" in the app; the database stores their first day
const firstDay = (month: string) => `${month}-01`;
const toMonth = (day: string) => day.slice(0, 7);

export async function fetchMonthlyStats(month: string) {
  return unwrap<MonthlyStats>(await supabase.rpc("monthly_stats", { p_month: firstDay(month) }));
}

/** Each bro's insights from their latest successful run, by bro id. */
export async function fetchInsights(month: string) {
  const runs = unwrap<{ bro_id: string; insights: Insight[] }[]>(
    await supabase
      .from("insight_runs")
      .select("bro_id, insights(position, type, content, sources)")
      .eq("month", firstDay(month))
      .eq("status", "succeeded")
      .order("started_at", { ascending: false }),
  );
  const byBro = new Map<string, Insight[]>();
  for (const run of runs) {
    if (byBro.has(run.bro_id)) continue; // newest first, so the first run is the latest
    byBro.set(
      run.bro_id,
      run.insights.sort((a, b) => a.position - b.position),
    );
  }
  return byBro;
}

/** Months with a report, newest first. Until S4, that's any month with a successful run. */
export async function fetchReportMonths() {
  const runs = unwrap<{ month: string }[]>(
    await supabase
      .from("insight_runs")
      .select("month")
      .eq("status", "succeeded")
      .order("month", { ascending: false }),
  );
  return [...new Set(runs.map((r) => toMonth(r.month)))];
}

/** The months this bro has opened (RLS returns only their own). */
export async function fetchReportViews() {
  const rows = unwrap<{ month: string }[]>(await supabase.from("report_views").select("month"));
  return rows.map((r) => toMonth(r.month));
}

export async function markReportViewed({ broId, month }: { broId: string; month: string }) {
  unwrap(
    await supabase
      .from("report_views")
      .upsert({ bro_id: broId, month: firstDay(month) }, { ignoreDuplicates: true }),
  );
}
