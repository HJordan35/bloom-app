// The bro's month, gathered by code (no LLM) and handed to the agent as its first message.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const TIME_ZONE = "America/Chicago";

export const BREW_SELECT =
  "id, bro_id, method, dose_g, grind_size, grinder, temp, temp_unit, brew_time_s, volume_ml, " +
  "brew_notes, brew_results, dialed_in, started_at, finished_at, " +
  "roast:roasts(id, name, region, roast_level, roaster:roasters(name, location)), bro:bros(first_name)";

type Roast = {
  id: string;
  name: string;
  region: string | null;
  roast_level: string;
  roaster: { name: string; location: string | null };
};

export type BrewRow = {
  id: string;
  bro_id: string;
  method: string;
  dose_g: number | null;
  grind_size: string | null;
  grinder: string | null;
  temp: number | null;
  temp_unit: string;
  brew_time_s: number | null;
  volume_ml: number | null;
  brew_notes: string | null;
  brew_results: string | null;
  dialed_in: boolean;
  started_at: string;
  finished_at: string | null;
  roast: Roast;
  bro: { first_name: string };
};

/** "2026-09" → the month's first day and the UTC instants it starts and ends at, in Chicago. */
export function monthBounds(month: string) {
  const [year, m] = month.split("-").map(Number);
  return {
    day: `${month}-01`,
    from: zonedMidnight(year, m, 1).toISOString(),
    to: zonedMidnight(m === 12 ? year + 1 : year, m === 12 ? 1 : m + 1, 1).toISOString(),
    label: new Date(Date.UTC(year, m - 1, 15)).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  };
}

export function previousMonth(month: string) {
  const [year, m] = month.split("-").map(Number);
  return m === 1 ? `${year - 1}-12` : `${year}-${String(m - 1).padStart(2, "0")}`;
}

/** The UTC instant of local midnight on a date in TIME_ZONE. */
function zonedMidnight(year: number, month: number, day: number) {
  const guess = Date.UTC(year, month - 1, day);
  return new Date(guess - offsetAt(guess));
}

/** How far TIME_ZONE's wall clock is ahead of UTC at an instant, in ms (negative in the US). */
function offsetAt(instant: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(new Date(instant))
      .map((p) => [p.type, p.value]),
  );
  const wall = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour,
    +parts.minute,
    +parts.second,
  );
  return wall - instant;
}

/** "Tue Sep 2, 7:41 AM" in Chicago time. */
export function localTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** A brew as compact JSON for the agent: local time, roast, recipe, notes. */
export function brewForAgent(b: BrewRow) {
  return {
    id: b.id,
    bro: b.bro.first_name,
    when: localTime(b.started_at),
    finished: !!b.finished_at,
    roast: b.roast.name,
    roast_id: b.roast.id,
    roaster: b.roast.roaster.name,
    roaster_location: b.roast.roaster.location,
    region: b.roast.region,
    roast_level: b.roast.roast_level,
    method: b.method,
    dose_g: b.dose_g,
    grind: b.grind_size,
    grinder: b.grinder,
    temp: b.temp == null ? null : `${b.temp}°${b.temp_unit}`,
    brew_time: b.brew_time_s == null ? null : mmss(b.brew_time_s),
    volume_ml: b.volume_ml,
    dialed_in: b.dialed_in,
    brew_notes: b.brew_notes,
    tasting_results: b.brew_results,
  };
}

/** The first user message: who, which month, everything they did, and how the group compares. */
export async function buildSnapshot(db: SupabaseClient, broId: string, month: string) {
  const { day, from, to, label } = monthBounds(month);
  const [bro, stats, brews, endorsements, roasts, roasters, lastInsights] = await Promise.all([
    db.from("bros").select("first_name, created_at").eq("id", broId).single(),
    // The same numbers the report shows, for every bro, so the agent can compare
    db.rpc("monthly_stats", { p_month: day }),
    db
      .from("brews")
      .select(BREW_SELECT)
      .eq("bro_id", broId)
      .gte("started_at", from)
      .lt("started_at", to)
      .order("started_at"),
    db
      .from("endorsements")
      .select("method, rating, note, created_at, roast:roasts(name, roaster:roasters(name))")
      .eq("bro_id", broId)
      .gte("created_at", from)
      .lt("created_at", to),
    db
      .from("roasts")
      .select("name, region, roast_level, roaster:roasters(name)")
      .eq("created_by", broId)
      .gte("created_at", from)
      .lt("created_at", to),
    db
      .from("roasters")
      .select("name, location")
      .eq("created_by", broId)
      .gte("created_at", from)
      .lt("created_at", to),
    lastMonthInsights(db, broId, previousMonth(month)),
  ]);
  for (const r of [bro, stats, brews, endorsements, roasts, roasters]) if (r.error) throw r.error;

  if (!bro.data) throw new Error(`No bro ${broId}`);
  const name = bro.data.first_name;
  const mine = (brews.data ?? []) as unknown as BrewRow[];
  const allBros = (stats.data.bros as { bro_id: string; first_name: string }[]).map((b) => ({
    id: b.bro_id,
    first_name: b.first_name,
  }));

  const sections = [
    `# ${name} — ${label}`,
    `Bro id: ${broId}. Joined Bloom ${localTime(bro.data.created_at)}. Month: ${label} (${day}), times in ${TIME_ZONE}.`,
    mine.length <= 1
      ? `THIN MONTH: ${name} logged ${mine.length} brew${mine.length === 1 ? "" : "s"} this month. Lean on their history (get_brews) — or on the drought itself.`
      : "",
    `## The month's numbers (the group's totals, every bro, brew methods; "first_tries" are roasts brewed for the first time)\n${json(stats.data)}`,
    `## ${name}'s brews this month (${mine.length})\n${json(mine.map(brewForAgent))}`,
    `## ${name}'s endorsements this month (${endorsements.data?.length ?? 0})\n${json(endorsements.data)}`,
    `## Roasts ${name} added this month\n${json(roasts.data)}`,
    `## Roasters ${name} added this month\n${json(roasters.data)}`,
    `## Bros (ids for get_brews / get_endorsements)\n${json(allBros)}`,
    `## ${name}'s insights last month (don't repeat these)\n${json(lastInsights)}`,
    `Write ${name}'s 3 insights for ${label}, then call submit_insights.`,
  ];
  return { text: sections.filter(Boolean).join("\n\n"), brewCount: mine.length };
}

/** The latest succeeded run's insights for a bro and month. */
async function lastMonthInsights(db: SupabaseClient, broId: string, month: string) {
  const { data: run } = await db
    .from("insight_runs")
    .select("id")
    .eq("bro_id", broId)
    .eq("month", `${month}-01`)
    .eq("status", "succeeded")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!run) return [];
  const { data } = await db
    .from("insights")
    .select("type, content")
    .eq("run_id", run.id)
    .order("position");
  return data ?? [];
}

export const json = (value: unknown) => JSON.stringify(value, null, 1);
