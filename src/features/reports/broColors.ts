import type { Bro } from "../../api/bros/bros.types";

// Wood tones from theme/tokens.stylex.ts, as literals: chart SVG paint can't read CSS vars
export const BRASS = "#B8935A";
export const LEATHER = "#6F4428";
const PALETTE = [BRASS, "#C8642F", "#D2B48C", "#9A6A42", LEATHER, "#5E3B24"];

/** A colour per bro, by their place in the full list sorted by first name, so it's the same every month. */
export function broColors(bros: Bro[]) {
  const sorted = [...bros].sort((a, b) => a.first_name.localeCompare(b.first_name));
  return new Map(sorted.map((bro, i) => [bro.id, PALETTE[i % PALETTE.length]]));
}
