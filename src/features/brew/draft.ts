import type { Brew, BrewOutcome, BrewProcess, Recipe, TempUnit } from "../../api/brews/brews.types";
import { toNumber, toSeconds } from "../../lib/format";

/** Form state for every brew field, shared by the start, finish, follow-up (and edit) sheets. */
export type BrewDraft = {
  dose: string;
  grindSize: string;
  grinder: string;
  temp: string;
  tempUnit: TempUnit;
  minutes: string;
  seconds: string;
  volume: string;
  brewNotes: string;
  brewResults: string;
  dialedIn: boolean;
};

const text = (value: number | string | null | undefined) => (value == null ? "" : String(value));
const orNull = (value: string) => value.trim() || null;

export function brewDraft(brew?: Partial<Brew> | null): BrewDraft {
  const time = brew?.brew_time_s;
  return {
    dose: text(brew?.dose_g),
    grindSize: text(brew?.grind_size),
    grinder: text(brew?.grinder),
    temp: text(brew?.temp),
    tempUnit: brew?.temp_unit ?? "F",
    minutes: time == null ? "" : String(Math.floor(time / 60)),
    seconds: time == null ? "" : String(time % 60),
    volume: text(brew?.volume_ml),
    brewNotes: text(brew?.brew_notes),
    brewResults: text(brew?.brew_results),
    dialedIn: brew?.dialed_in ?? false,
  };
}

export function recipeFromDraft(d: BrewDraft): Recipe {
  return {
    dose_g: toNumber(d.dose),
    grind_size: orNull(d.grindSize),
    grinder: orNull(d.grinder),
    temp: toNumber(d.temp),
    temp_unit: d.tempUnit,
  };
}

export function processFromDraft(d: BrewDraft): BrewProcess {
  return {
    brew_time_s: toSeconds(d.minutes, d.seconds),
    volume_ml: toNumber(d.volume),
    brew_notes: orNull(d.brewNotes),
  };
}

export function outcomeFromDraft(d: BrewDraft): BrewOutcome {
  return { brew_results: orNull(d.brewResults), dialed_in: d.dialedIn };
}
