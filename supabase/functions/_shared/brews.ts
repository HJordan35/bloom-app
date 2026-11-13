// Brews as the agents read them: the columns to select, and a compact JSON form.
// Shared by insights and coach.

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
