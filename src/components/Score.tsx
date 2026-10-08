import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import type { Ranking } from "../api/rankings/rankings.types";
import { formatScore } from "../lib/ranking";
import { colors, fonts, space } from "../theme/tokens.stylex";
import { RankingSheet } from "./RankingSheet";

type Props = {
  ranking?: Ranking;
  /** e.g. { position: 2, total: 9 } → "#2 of 9" */
  rank?: { position: number; total: number };
};

/** Ranking block for detail headers. Tap to see how the score is made. */
export function Score({ ranking, rank }: Props) {
  const [explaining, setExplaining] = useState(false);
  const brews = ranking?.brew_count ?? 0;

  return (
    <>
      <button type="button" onClick={() => setExplaining(true)} {...stylex.props(styles.wrap)}>
        <span {...stylex.props(styles.score)}>{formatScore(ranking)}</span>
        <span {...stylex.props(styles.caption)}>
          {rank && (
            <span {...stylex.props(styles.rank)}>
              #{rank.position} of {rank.total}
            </span>
          )}
          <span>
            {brews} {brews === 1 ? "brew" : "brews"}
          </span>
        </span>
        <span {...stylex.props(styles.how)}>How?</span>
      </button>
      {explaining && (
        <RankingSheet
          title="How this score works"
          ranking={ranking}
          onClose={() => setExplaining(false)}
        />
      )}
    </>
  );
}

const styles = stylex.create({
  wrap: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: space.md,
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    textAlign: "left",
    cursor: "pointer",
  },
  score: {
    fontFamily: fonts.mono,
    fontSize: 40,
    lineHeight: 1,
    color: colors.brass,
  },
  caption: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    paddingLeft: space.md,
    borderLeftWidth: 1,
    borderLeftStyle: "solid",
    borderLeftColor: colors.hairline,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
  },
  rank: {
    color: colors.text,
  },
  how: {
    alignSelf: "flex-start",
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.faint,
  },
});
