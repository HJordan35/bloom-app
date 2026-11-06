import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

/** A day's finished brews, and how many of them were dialed in. */
export type DayBrews = { brews: number; dialed: number };

/** A local month as "yyyy-MM": the key for a month's brews. */
export function monthKey(date: Date) {
  return format(date, "yyyy-MM");
}

/** Finished brews bucketed into their local days. */
export function brewsByDay(brews: { finished_at: string | null; dialed_in: boolean }[]) {
  const days = new Map<string, DayBrews>();
  for (const brew of brews) {
    if (!brew.finished_at) continue;
    const key = dayKey(new Date(brew.finished_at));
    const day = days.get(key) ?? { brews: 0, dialed: 0 };
    days.set(key, { brews: day.brews + 1, dialed: day.dialed + Number(brew.dialed_in) });
  }
  return days;
}

/** A local day as "yyyy-MM-dd": the key for a day's brews and the selected day. */
export function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/** The month's days in Sunday-first weeks; days from the months either side are null. */
export function monthGrid(month: Date): (Date | null)[] {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });
  return days.map((day) => (isSameMonth(day, month) ? day : null));
}
