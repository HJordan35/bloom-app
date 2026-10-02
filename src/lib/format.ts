import type { Brew } from "./types";

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

/** "3:30" → 210, "45" → 45 seconds, "" → null. */
export function parseDuration(input: string) {
  const value = input.trim();
  if (!value) return null;
  const [a, b] = value.split(":");
  const seconds = b === undefined ? Number(a) : Number(a) * 60 + Number(b);
  return Number.isFinite(seconds) ? Math.round(seconds) : null;
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

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

/** "18g · 2.4 · 93°" */
export function recipeLine(brew: Pick<Brew, "dose_g" | "grind_size" | "temp_c">) {
  return [
    brew.dose_g != null && `${brew.dose_g}g`,
    brew.grind_size,
    brew.temp_c != null && `${brew.temp_c}°`,
  ]
    .filter(Boolean)
    .join(" · ");
}
