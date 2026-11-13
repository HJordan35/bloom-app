import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import type { CoachChange, CoachRecipe } from "../../api/coach/coach.types";
import { Button } from "../../components/Button";
import { formatTemp, mmss } from "../../lib/format";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";

type Field = CoachChange["field"];

const LABELS: Record<Field, string> = {
  method: "Method",
  dose_g: "Dose",
  grind_size: "Grind",
  grinder: "Grinder",
  temp: "Temp",
  brew_time_s: "Brew time",
  volume_ml: "Volume",
  brew_notes: "Notes",
};

// The numbers grid, in the order the brew's own recipe shows them
const STATS: Field[] = ["dose_g", "grind_size", "grinder", "temp", "brew_time_s", "volume_ml"];

/** A card's button: runs once, then reads as done. */
export type CardAction = { label: string; done: string; run: () => void | Promise<void> };

/**
 * The coach's card: always the whole recipe. What it changed from the base comes first, each
 * as before → after with its reason, and those values are picked out in the recipe below.
 */
export function RecipeCard({ card, actions }: { card: CoachRecipe; actions: CardAction[] }) {
  const { recipe, changes } = card;
  const changed = new Set(changes.map((change) => change.field));
  const show = (field: Field, value: string | number | null) => {
    if (value == null || value === "") return "—";
    if (field === "dose_g") return `${value} g`;
    if (field === "temp") return formatTemp({ temp: Number(value), temp_unit: recipe.temp_unit });
    if (field === "brew_time_s") return mmss(Number(value));
    if (field === "volume_ml") return `${value} ml`;
    return String(value);
  };

  return (
    <article {...stylex.props(styles.card)}>
      <h4 {...stylex.props(styles.label)}>
        {[recipe.method, recipe.label].filter(Boolean).join(" · ")}
      </h4>
      {card.summary && <p {...stylex.props(styles.why)}>{card.summary}</p>}

      {changes.map((change) => (
        <div key={change.field} {...stylex.props(styles.change)}>
          <span {...stylex.props(styles.field)}>{LABELS[change.field]}</span>
          {change.field !== "brew_notes" && (
            <p {...stylex.props(styles.values)}>
              <span {...stylex.props(styles.from)}>{show(change.field, change.from)}</span>
              <span {...stylex.props(styles.arrow)}>→</span>
              {show(change.field, change.to)}
            </p>
          )}
          {change.why && <p {...stylex.props(styles.why)}>{change.why}</p>}
        </div>
      ))}

      <dl {...stylex.props(styles.stats, changes.length > 0 && styles.ruled)}>
        {STATS.map((field) => (
          <div key={field} {...stylex.props(styles.stat)}>
            <dt {...stylex.props(styles.field)}>{LABELS[field]}</dt>
            <dd {...stylex.props(styles.value, changed.has(field) && styles.changed)}>
              {show(field, recipe[field])}
            </dd>
          </div>
        ))}
      </dl>
      {recipe.brew_notes && <p {...stylex.props(styles.notes)}>{recipe.brew_notes}</p>}

      <p {...stylex.props(styles.next)}>{card.next}</p>
      <div {...stylex.props(styles.actions)}>
        {actions.map((action) => (
          <CardButton key={action.label} action={action} />
        ))}
      </div>
    </article>
  );
}

function CardButton({ action }: { action: CardAction }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  async function run() {
    setState("busy");
    try {
      await action.run();
      setState("done");
    } catch {
      setState("idle");
    }
  }
  return (
    <Button variant="text" onClick={run} disabled={state === "busy"}>
      {state === "done" ? action.done : action.label}
    </Button>
  );
}

const arrive = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(6px)" },
  to: { opacity: 1, transform: "translateY(0)" },
});

const styles = stylex.create({
  card: {
    // Once, as the card first appears
    animationName: { default: arrive, "@media (prefers-reduced-motion: reduce)": "none" },
    animationDuration: "320ms",
    animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    display: "flex",
    flexDirection: "column",
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.md,
  },
  label: {
    fontFamily: fonts.mono,
    fontWeight: 400,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  change: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  field: {
    fontSize: 11,
    color: colors.muted,
  },
  values: {
    fontFamily: fonts.mono,
    fontSize: 16,
  },
  from: {
    color: colors.muted,
  },
  arrow: {
    marginInline: space.sm,
    color: colors.faint,
  },
  why: {
    fontSize: 13,
    lineHeight: 1.5,
    color: colors.muted,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    rowGap: space.md,
    columnGap: space.md,
  },
  // Under the changes, the recipe they add up to
  ruled: {
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.hairline,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 16,
  },
  changed: {
    color: colors.brass,
  },
  notes: {
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  // The coach's parting line, set apart by a hairline
  next: {
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.hairline,
    fontFamily: fonts.display,
    fontStyle: "italic",
    fontSize: 14,
    lineHeight: 1.5,
    color: colors.muted,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: space.lg,
    marginBlock: `calc(-1 * ${space.sm})`,
  },
});
