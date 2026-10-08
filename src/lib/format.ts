import type { Brew } from "../api/brews/brews.types";

const pad = (n: number) => String(n).padStart(2, "0");

export function mmss(seconds: number) {
  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
}

/** Time since `iso`: "4:12" under an hour, "5h 03m" after. */
export function elapsed(iso: string, now: number) {
  const s = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (s < 3600) return mmss(s);
  return `${Math.floor(s / 3600)}h ${pad(Math.floor((s % 3600) / 60))}m`;
}

/** Separate minute and second inputs → total seconds, or null when both are empty. */
export function toSeconds(minutes: string, seconds: string) {
  const m = toNumber(minutes);
  const s = toNumber(seconds);
  if (m == null && s == null) return null;
  return Math.round((m ?? 0) * 60 + (s ?? 0));
}

export function toNumber(input: string) {
  return input.trim() === "" ? null : Number(input);
}

export function relativeDate(iso: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const days = Math.floor(
    (new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000,
  );
  if (days === 0) return `Today ${time}`;
  if (days === 1) return `Yesterday ${time}`;
  if (days < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

/** Feed day heading: "Today", "Yesterday", "Tuesday", "12 Sep". */
export function dayHeading(iso: string) {
  const days = Math.floor(
    (new Date().setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86_400_000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  const date = new Date(iso);
  if (days < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

/** "200°F" in the unit the brew was recorded in */
export function formatTemp(brew: Pick<Brew, "temp" | "temp_unit">) {
  return brew.temp == null ? null : `${brew.temp}°${brew.temp_unit}`;
}

/** "18g · 2.4 · 200°F" */
export function recipeLine(brew: Pick<Brew, "dose_g" | "grind_size" | "temp" | "temp_unit">) {
  return [brew.dose_g != null && `${brew.dose_g}g`, brew.grind_size, formatTemp(brew)]
    .filter(Boolean)
    .join(" · ");
}
