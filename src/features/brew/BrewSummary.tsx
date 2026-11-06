import * as stylex from "@stylexjs/stylex";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { SummaryHeader } from "../../components/SummaryHeader";
import { TextSection } from "../../components/TextSection";
import { useCurrentBro } from "../../lib/auth";
import { broLabel } from "../../lib/bros";
import { relativeDate } from "../../lib/format";
import { colors } from "../../theme/tokens.stylex";
import { BrewRecipe } from "./BrewStats";

/** A past brew in full, to borrow its recipe: "Use recipe" sits in the Recipe header. */
export function BrewSummary({ brew, onUse }: { brew: BrewWithRoast; onUse: () => void }) {
  const me = useCurrentBro();
  return (
    <>
      <SummaryHeader
        eyebrow={`${broLabel(brew.bro, me.id)} · ${brew.roast.name} · ${relativeDate(brew.started_at)}`}
      >
        {brew.method}
        {brew.dialed_in && <span {...stylex.props(styles.dialed)}>✦ Dialed in</span>}
      </SummaryHeader>
      <BrewRecipe brew={brew} onUse={onUse} />
      <TextSection label="Brew notes" text={brew.brew_notes} />
      <TextSection label="Results" text={brew.brew_results} />
    </>
  );
}

const styles = stylex.create({
  dialed: {
    color: colors.brass,
  },
});
