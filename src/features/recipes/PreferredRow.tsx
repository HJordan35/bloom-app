import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import type {
  PreferredRecipe,
  PreferredRecipeWithRoast,
} from "../../api/preferred/preferred.types";
import { Section } from "../../components/Section";
import { mmss, recipeLine } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { BrewRecipe } from "../brew/BrewStats";

/** "18g · 14 · 205°F · Comandante · 3:30": the recipe at a glance. */
export function preferredLine(recipe: PreferredRecipe) {
  return [
    recipeLine(recipe),
    recipe.grinder,
    recipe.brew_time_s != null && mmss(recipe.brew_time_s),
  ]
    .filter(Boolean)
    .join(" · ");
}

/** What tells one of several apart: its label, else its numbers. */
export function recipeName(recipe: PreferredRecipe) {
  return recipe.label ?? (recipeLine(recipe) || recipe.method);
}

export function PreferredRow({
  recipe,
  you,
  onClick,
}: {
  recipe: PreferredRecipeWithRoast;
  you: boolean;
  onClick: () => void;
}) {
  const line = preferredLine(recipe);
  return (
    <button type="button" onClick={onClick} {...stylex.props(styles.row)}>
      <span>
        {you ? "You" : recipe.bro.first_name} · {recipe.method}
        {recipe.label && <span {...stylex.props(styles.label)}> · {recipe.label}</span>}
      </span>
      {line && <span {...stylex.props(styles.meta)}>{line}</span>}
    </button>
  );
}

/** A preferred recipe in full. `action` sits at the end of the top line (Edit, Save as mine). */
export function PreferredSummary({
  recipe,
  you,
  action,
}: {
  recipe: PreferredRecipeWithRoast;
  you: boolean;
  action?: ReactNode;
}) {
  return (
    <>
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.top)}>
          <p {...stylex.props(styles.eyebrow)}>
            {you ? "You" : recipe.bro.first_name} · {recipe.roast.name}
          </p>
          {action}
        </div>
        <p {...stylex.props(styles.title)}>
          {recipe.method}
          {recipe.label && <span {...stylex.props(styles.label)}>{recipe.label}</span>}
        </p>
      </header>

      <BrewRecipe brew={recipe} />

      {recipe.brew_notes && (
        <Section label="Brew notes">
          <p {...stylex.props(styles.notes)}>{recipe.brew_notes}</p>
        </Section>
      )}
    </>
  );
}

const styles = stylex.create({
  row: {
    width: "100%",
    minHeight: 60,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingBlock: space.sm,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
    color: colors.text,
    textAlign: "left",
    cursor: "pointer",
  },
  label: {
    color: colors.muted,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
  },
  top: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  title: {
    display: "flex",
    gap: space.md,
    alignItems: "baseline",
    fontFamily: fonts.display,
    fontSize: 22,
  },
  notes: {
    whiteSpace: "pre-wrap",
  },
});
