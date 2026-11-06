import * as stylex from "@stylexjs/stylex";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { Section } from "../../components/Section";
import { relativeDate } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { BrewRecipe } from "./BrewStats";

/** A past brew in full, to borrow its recipe: "Use recipe" sits in the Recipe header. */
export function BrewSummary({
  brew,
  you,
  onUse,
}: {
  brew: BrewWithRoast;
  you: boolean;
  onUse: () => void;
}) {
  return (
    <>
      <header {...stylex.props(styles.header)}>
        <p {...stylex.props(styles.eyebrow)}>
          {you ? "You" : brew.bro.first_name} · {brew.roast.name} · {relativeDate(brew.started_at)}
        </p>
        <p {...stylex.props(styles.method)}>
          {brew.method}
          {brew.dialed_in && <span {...stylex.props(styles.dialed)}>✦ Dialed in</span>}
        </p>
      </header>

      <BrewRecipe brew={brew} onUse={onUse} />

      {brew.brew_notes && (
        <Section label="Brew notes">
          <p {...stylex.props(styles.notes)}>{brew.brew_notes}</p>
        </Section>
      )}

      {brew.brew_results && (
        <Section label="Results">
          <p {...stylex.props(styles.notes)}>{brew.brew_results}</p>
        </Section>
      )}
    </>
  );
}

const styles = stylex.create({
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  method: {
    display: "flex",
    gap: space.md,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  dialed: {
    color: colors.brass,
  },
  notes: {
    whiteSpace: "pre-wrap",
  },
});
