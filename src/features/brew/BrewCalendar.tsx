import * as stylex from "@stylexjs/stylex";
import { addMonths, format, isAfter, isSameMonth, isToday, startOfDay } from "date-fns";
import { TextToggle } from "../../components/TextToggle";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { type DayBrews, dayKey, monthGrid } from "./calendar";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const NO_BREWS: DayBrews = { brews: 0, dialed: 0 };

/**
 * Quality: a small diamond per brew under the number, filled when dialed in.
 * Quantity: one diamond mark behind the number that climbs with the day's brew count.
 */
export type CalendarView = "quality" | "quantity";

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "quality", label: "Quality" },
  { value: "quantity", label: "Quantity" },
];

type Props = {
  /** Any day in the month shown. */
  month: Date;
  /** Each local day's brews, keyed by `dayKey`. */
  days: ReadonlyMap<string, DayBrews>;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  selected: string | null;
  /** The tapped day, or null when the selected day is tapped again. */
  onSelect: (day: string | null) => void;
  onMonthChange: (month: Date) => void;
};

/** A month of your brews in brass diamonds. */
export function BrewCalendar({
  month,
  days,
  view,
  onViewChange,
  selected,
  onSelect,
  onMonthChange,
}: Props) {
  const today = startOfDay(new Date());
  const atCurrent = isSameMonth(month, today);

  return (
    <div {...stylex.props(styles.calendar)}>
      {/* ‹ Month › on the left, the view switch on the right: one row */}
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.nav)}>
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onMonthChange(addMonths(month, -1))}
            {...stylex.props(styles.arrow)}
          >
            ‹
          </button>
          <h3 {...stylex.props(styles.title)}>{format(month, "MMMM yyyy")}</h3>
          <button
            type="button"
            aria-label="Next month"
            disabled={atCurrent}
            onClick={() => onMonthChange(addMonths(month, 1))}
            {...stylex.props(styles.arrow, atCurrent && styles.arrowOff)}
          >
            ›
          </button>
        </div>
        <TextToggle options={VIEWS} value={view} onChange={onViewChange} />
      </div>

      <div {...stylex.props(styles.grid)}>
        {WEEKDAYS.map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: two T's and two S's
          <span key={i} {...stylex.props(styles.weekday)}>
            {d}
          </span>
        ))}
        {monthGrid(month).map((day, i) => {
          if (!day) {
            // biome-ignore lint/suspicious/noArrayIndexKey: blank cells have only their place
            return <span key={i} />;
          }
          const key = dayKey(day);
          const brews = days.get(key) ?? NO_BREWS;
          const level = levelOf(brews.brews);
          const future = isAfter(day, today);
          return (
            <button
              key={key}
              type="button"
              disabled={future}
              aria-pressed={selected === key}
              aria-label={format(day, "d MMMM")}
              onClick={() => onSelect(selected === key ? null : key)}
              {...stylex.props(
                styles.day,
                view === "quality" && styles.stacked,
                brews.brews > 0 && styles.brewed,
                view === "quantity" && level === 3 && styles.onSolid,
                future && styles.future,
                isToday(day) && styles.today,
                selected === key && styles.selected,
              )}
            >
              {view === "quality" ? (
                <>
                  {format(day, "d")}
                  <Pips {...brews} />
                </>
              ) : (
                <>
                  {level > 0 && <LevelMark level={level} xstyle={styles.fill} />}
                  <span {...stylex.props(styles.number, level < 3 && styles.backed)}>
                    {format(day, "d")}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div {...stylex.props(styles.legend)}>
        {view === "quality"
          ? [false, true].map((dialed) => (
              <span key={String(dialed)} {...stylex.props(styles.key)}>
                <Pip dialed={dialed} />
                {dialed ? "dialed in" : "brewed"}
              </span>
            ))
          : LEVELS.map((name, level) => (
              <span key={name} {...stylex.props(styles.key)}>
                <LevelMark level={level as Level} xstyle={styles.mark} />
                {name}
              </span>
            ))}
      </div>
    </div>
  );
}

// Outlines are inset half a unit so the stroke isn't clipped at the edges
const DIAMOND = "M5 0.5 9.5 5 5 9.5 0.5 5Z";
const LOWER_HALF = "M0.5 5 5 9.5 9.5 5Z";
const CORE = "M5 1.6 8.4 5 5 8.4 1.6 5Z";

// Quality

const MAX_PIPS = 4;

/** A small diamond per brew (up to four), dialed-in ones first and filled. */
function Pips({ brews, dialed }: DayBrews) {
  return (
    // Always there, so every number sits at the same height
    <span {...stylex.props(styles.pips)}>
      {Array.from({ length: Math.min(brews, MAX_PIPS) }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: pips are only their place
        <Pip key={i} dialed={i < dialed} />
      ))}
    </span>
  );
}

function Pip({ dialed }: { dialed: boolean }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" {...stylex.props(styles.pip)}>
      <path
        d={DIAMOND}
        vectorEffect="non-scaling-stroke"
        {...stylex.props(paints.line, dialed && paints.solid)}
      />
    </svg>
  );
}

// Quantity

/** How caffeinated a day was, by brew count (3 and up is ascended). */
const LEVELS = ["comatose", "functioning", "caffeinated", "ascended"] as const;
type Level = 0 | 1 | 2 | 3;

function levelOf(brews: number) {
  return Math.min(brews, 3) as Level;
}

// Every level is the diamond or half of it, so each covers the same ground and only the
// treatment climbs: the lower half outlined, the whole outlined, then ascended's brass (the ✦
// colour), a solid core inside the outline
const LEVEL_PATHS: Record<Exclude<Level, 0>, { d: string; solid?: boolean }[]> = {
  1: [{ d: LOWER_HALF }],
  2: [{ d: DIAMOND }],
  3: [{ d: DIAMOND }, { d: CORE, solid: true }],
};

/** A level's mark: filling a day behind its number, or small in the legend (comatose: a ring). */
function LevelMark({ level, xstyle }: { level: Level; xstyle: stylex.StyleXStyles }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" {...stylex.props(xstyle)}>
      {level === 0 ? (
        <circle cx="5" cy="5" r="2.5" {...stylex.props(paints.faintLine)} />
      ) : (
        LEVEL_PATHS[level].map(({ d, solid }) => (
          <path
            key={d}
            d={d}
            vectorEffect="non-scaling-stroke"
            {...stylex.props(solid ? paints.solid : paints.line)}
          />
        ))
      )}
    </svg>
  );
}

const paints = stylex.create({
  solid: { fill: colors.brass },
  line: { fill: "none", stroke: colors.brass, strokeWidth: 1 },
  faintLine: { fill: "none", stroke: colors.faint, strokeWidth: 1 },
});

const styles = stylex.create({
  calendar: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Wide enough for "September 2026", so the arrows don't shift between months
  title: {
    minWidth: 118,
    textAlign: "center",
    fontFamily: fonts.display,
    fontWeight: 400,
    fontSize: 15,
    color: colors.text,
  },
  nav: {
    display: "flex",
    alignItems: "center",
  },
  arrow: {
    // A 44px target that overhangs the row, like HeaderAction
    minWidth: 24,
    minHeight: 44,
    marginBlock: -14,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    fontSize: 18,
    color: colors.muted,
    cursor: "pointer",
  },
  arrowOff: {
    color: colors.faint,
    cursor: "default",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    justifyItems: "center",
    columnGap: 6,
    // Room under each week for the selected day's bar
    rowGap: 8,
  },
  weekday: {
    paddingBottom: space.xs,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.faint,
  },
  // Days grow to fill their column, up to a cap
  day: {
    position: "relative",
    width: "100%",
    maxWidth: 42,
    aspectRatio: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: radius.sm,
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.muted,
    cursor: "pointer",
  },
  brewed: {
    color: colors.text,
  },
  // Quantity: dark and heavier on ascended's solid diamond
  onSolid: {
    color: colors.bg,
    fontWeight: 600,
  },
  future: {
    color: colors.faint,
    cursor: "default",
  },
  // Today: a thin brass ring, drawn as an outline so it sits over a quantity mark
  today: {
    outlineWidth: 1,
    outlineStyle: "solid",
    outlineColor: colors.brass,
    outlineOffset: -1,
  },
  // The picked day: a short bar under the box, in the gap before the next week
  selected: {
    "::after": {
      content: "''",
      position: "absolute",
      left: 0,
      right: 0,
      bottom: -5,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.text,
    },
  },
  // Quantity: the mark behind a day's number
  fill: {
    // An svg doesn't stretch to its insets, so it's sized outright: the whole cell
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  number: {
    position: "relative",
  },
  // Quality: the number with its row of pips under it
  stacked: {
    flexDirection: "column",
    gap: 5,
  },
  pips: {
    height: 6,
    display: "flex",
    gap: 2,
  },
  pip: {
    width: 6,
    height: 6,
  },
  // Below ascended the number sits on a patch of page, so an outline never runs through it
  backed: {
    paddingInline: 2,
    lineHeight: 1.2,
    backgroundColor: colors.bg,
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: space.md,
    rowGap: space.xs,
    paddingTop: space.xs,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
  },
  key: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  mark: {
    width: 9,
    height: 9,
    flexShrink: 0,
  },
});
