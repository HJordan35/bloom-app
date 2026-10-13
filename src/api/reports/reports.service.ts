import { supabase } from "../../lib/supabase";
import { unwrap } from "../api.utils";
import { PHOTO_BUCKET } from "../roasts/roasts.service";
import type { Insight, MonthlyStats, NewRoast } from "./reports.types";

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

/** The roasts the group brewed for the first time this month, most brewed first. */
export async function fetchNewRoasts(month: string) {
  return unwrap<NewRoast[]>(await supabase.rpc("month_new_roasts", { p_month: firstDay(month) }));
}

/** The month's showcase image (its latest successful run), or null before there is one. */
export async function fetchShowcase(month: string) {
  const run = unwrap<{ image_path: string } | null>(
    await supabase
      .from("showcase_runs")
      .select("image_path")
      .eq("month", firstDay(month))
      .eq("status", "succeeded")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  return run && photoUrl(run.image_path);
}

/** A public URL for a path in the roast-photos bucket. */
export function photoUrl(path: string) {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Each new coffee's insight (its latest successful run), by roast id. */
export async function fetchRoastInsights(month: string) {
  const rows = unwrap<(Omit<Insight, "position"> & { roast_id: string })[]>(
    await supabase
      .from("roast_insights")
      .select("roast_id, type, content, sources")
      .eq("month", firstDay(month))
      .eq("status", "succeeded")
      .order("started_at", { ascending: false }),
  );
  const byRoast = new Map<string, Insight>();
  for (const { roast_id, ...insight } of rows) {
    // Newest first, so the first row per roast is its latest
    if (!byRoast.has(roast_id)) byRoast.set(roast_id, { position: 1, ...insight });
  }
  return byRoast;
}
