import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import type { MonthlyStats, MonthNumbers } from "../../api/reports/reports.types";
import { volume, weight } from "../../lib/format";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { Sparkline } from "./Sparkline";

const shortMonth = (month: string) =>
  new Date(`${month}-15`).toLocaleDateString([], { month: "short" });

/** The month's big numbers as tiles. Brews, volume and new roasts carry a trend over `history`. */
export function HeadlineMosaic({
  stats,
  history,
}: {
  stats: MonthlyStats;
  /** Oldest first, ending with this month. */
  history: MonthlyStats[];
}) {
  const { totals } = stats;
  const previous = history.at(-2);
  const trend = (key: keyof MonthNumbers) => {
    const points = history.map((h) => ({
      month: h.month.slice(0, 7),
      value: Number(h.totals[key]),
    }));
    // A first month still gets a line: up from zero the month before
    return points.length === 1
      ? [{ month: monthBefore(points[0].month), value: 0 }, ...points]
      : points;
  };

  /** "+12 vs Aug", or nothing without a previous month. */
  const delta = (key: keyof MonthNumbers, format: (n: number) => string | number = Math.round) => {
    if (!previous) return null;
    const diff = Number(totals[key]) - Number(previous.totals[key]);
    const sign = diff > 0 ? "+" : diff < 0 ? "−" : "±";
    return `${sign}${format(Math.abs(diff))} vs ${shortMonth(previous.month.slice(0, 7))}`;
  };

  return (
    <div {...stylex.props(styles.grid)}>
      <Tile label="Brews" note={delta("brews")} tone="hero" wide>
        <Figure value={totals.brews} size="hero" />
        <div {...stylex.props(styles.heroSpark)}>
          <Sparkline
            points={trend("brews")}
            variant="area"
            height={56}
            ariaLabel="Brews by month"
          />
        </div>
      </Tile>
      <Tile label="Volume" note={delta("volume_ml", volume)}>
        <Figure value={volume(totals.volume_ml)} />
        <Sparkline
          points={trend("volume_ml")}
          variant="bars"
          height={28}
          ariaLabel="Volume by month"
        />
      </Tile>
      <Tile label="New roasts" note={delta("roasts")}>
        <Figure value={totals.roasts} />
        <Sparkline
          points={trend("roasts")}
          variant="bars"
          height={28}
          ariaLabel="New roasts by month"
        />
      </Tile>
      <Tile label="Beans ground" tone="mahogany">
        <Figure value={weight(totals.beans_g)} />
      </Tile>
      <Tile label="Dialed in">
        <Figure value={totals.dialed_in} />
      </Tile>
      <Tile label="Roasts tried" note={`${totals.first_tries} first tries`}>
        <Figure value={totals.roasts_tried} />
      </Tile>
      <Tile label="Endorsed">
        <Figure value={totals.endorsements} />
      </Tile>
    </div>
  );
}

function Tile({
  label,
  note,
  tone,
  wide = false,
  children,
}: {
  label: string;
  note?: string | null;
  tone?: "hero" | "mahogany";
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div {...stylex.props(styles.tile, wide && styles.wide, tone && styles[tone])}>
      <span {...stylex.props(styles.label, tone === "mahogany" && styles.onMahogany)}>{label}</span>
      {children}
      {note && (
        <span
          {...stylex.props(
            styles.note,
            tone === "hero" && styles.noteUnder,
            tone === "mahogany" && styles.onMahogany,
          )}
        >
          {note}
        </span>
      )}
    </div>
  );
}

/** A big number, with any unit ("9.9 L") set small after it. */
export function Figure({
  value,
  size = "md",
}: {
  value: string | number;
  size?: "hero" | "md" | "sm";
}) {
  const [number, unit] = String(value).split(" ");
  return (
    <span {...stylex.props(styles.figure, sizes[size])}>
      {number}
      {unit && <span {...stylex.props(styles.unit)}>{unit}</span>}
    </span>
  );
}

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: space.sm,
  },
  tile: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
    minHeight: 96,
    padding: space.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.md,
  },
  wide: {
    gridColumn: "1 / -1",
    minHeight: 168,
  },
  hero: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.leather,
  },
  mahogany: {
    backgroundColor: colors.leather,
    borderColor: colors.leather,
  },
  heroSpark: {
    position: "absolute",
    insetInline: 0,
    bottom: 0,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  onMahogany: {
    color: colors.text,
    opacity: 0.75,
  },
  noteUnder: {
    marginTop: 0,
  },
  note: {
    marginTop: "auto",
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.muted,
  },
  figure: {
    fontFamily: fonts.mono,
    lineHeight: 1,
    letterSpacing: "-0.03em",
    whiteSpace: "nowrap",
  },
  unit: {
    marginLeft: 3,
    fontSize: "0.45em",
    letterSpacing: 0,
    color: colors.muted,
  },
});

const sizes = stylex.create({
  hero: {
    fontSize: 64,
  },
  md: {
    fontSize: 34,
  },
  sm: {
    fontSize: 20,
  },
});

/** "2026-09" → "2026-08". */
function monthBefore(month: string) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 2);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
