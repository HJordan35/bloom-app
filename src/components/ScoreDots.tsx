import * as stylex from "@stylexjs/stylex";
import { isRanked } from "../lib/ranking";
import type { Ranking } from "../lib/types";
import { colors } from "../theme/tokens.stylex";

/** The 0–10 score (rating and brews combined) as ten dots; all empty when unranked. */
export function ScoreDots({ ranking }: { ranking: Ranking | undefined }) {
  const filled = isRanked(ranking) ? Math.round(ranking.score) : 0;
  return (
    <span
      role="img"
      aria-label={isRanked(ranking) ? `Score ${ranking.score.toFixed(1)} of 10` : "Unranked"}
      {...stylex.props(styles.row)}
    >
      {Array.from({ length: 10 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed set of ten dots
        <span key={i} {...stylex.props(styles.dot, i < filled && styles.filled)} />
      ))}
    </span>
  );
}

const styles = stylex.create({
  row: {
    display: "flex",
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.faint,
  },
  filled: {
    borderColor: colors.brass,
    backgroundColor: colors.brass,
  },
});
