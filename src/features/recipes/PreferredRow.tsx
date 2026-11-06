import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import type {
  PreferredRecipe,
  PreferredRecipeWithRoast,
} from "../../api/preferred/preferred.types";
import { Avatar } from "../../components/Avatar";
import { SummaryHeader } from "../../components/SummaryHeader";
import { TextSection } from "../../components/TextSection";
import { useCurrentBro } from "../../lib/auth";
import { broLabel } from "../../lib/bros";
import { mmss, recipeLine } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { NotesLine } from "../brew/BrewRows";
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
  onClick,
}: {
  recipe: PreferredRecipeWithRoast;
  onClick: () => void;
}) {
  const me = useCurrentBro();
  const line = preferredLine(recipe);
  return (
    <button type="button" onClick={onClick} {...stylex.props(styles.row)}>
      <Avatar bro={recipe.bro} size="xs" self={recipe.bro_id === me.id} />
      <span {...stylex.props(styles.main)}>
        <span>
          {recipe.method}
          {recipe.label && <span {...stylex.props(styles.label)}> · {recipe.label}</span>}
        </span>
        {line && <span {...stylex.props(styles.meta)}>{line}</span>}
        <NotesLine notes={recipe.brew_notes} />
      </span>
    </button>
  );
}

/**
 * A preferred recipe in full. `action` sits at the end of the top line (Edit, Save as mine);
 * `onUse` adds "Use recipe" to the Recipe header, as on a brew.
 */
export function PreferredSummary({
  recipe,
  action,
  onUse,
}: {
  recipe: PreferredRecipeWithRoast;
  action?: ReactNode;
  onUse?: () => void;
}) {
  const me = useCurrentBro();
  return (
    <>
      <SummaryHeader
        eyebrow={`${broLabel(recipe.bro, me.id)} · ${recipe.roast.name}`}
        action={action}
      >
        {recipe.method}
        {recipe.label && <span {...stylex.props(styles.label)}>{recipe.label}</span>}
      </SummaryHeader>
      <BrewRecipe brew={recipe} onUse={onUse} />
      <TextSection label="Brew notes" text={recipe.brew_notes} />
    </>
  );
}

const styles = stylex.create({
  row: {
    width: "100%",
    minHeight: 60,
    display: "flex",
    alignItems: "center",
    gap: space.md,
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
  main: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
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
});
