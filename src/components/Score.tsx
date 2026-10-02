import * as stylex from "@stylexjs/stylex";
import type { Ranking } from "../lib/types";
import { colors, fonts, space } from "../theme/tokens.stylex";

/** Ranking block for detail headers: big score + brews / rating caption. */
export function Score({ ranking }: { ranking?: Ranking }) {
  const brews = ranking?.brew_count ?? 0;
  return (
    <div {...stylex.props(styles.wrap)}>
      <span {...stylex.props(styles.score)}>{ranking ? ranking.score.toFixed(1) : "—"}</span>
      <span {...stylex.props(styles.caption)}>
        <span>
          {brews} {brews === 1 ? "brew" : "brews"}
        </span>
        <span>
          {ranking?.avg_rating != null
            ? `Rated ${ranking.avg_rating.toFixed(1)} · ${ranking.rating_count}`
            : "Unrated"}
        </span>
      </span>
    </div>
  );
}

const styles = stylex.create({
  wrap: {
    display: "flex",
    alignItems: "center",
    gap: space.md,
  },
  score: {
    fontFamily: fonts.mono,
    fontSize: 40,
    lineHeight: 1,
    color: colors.brass,
  },
  caption: {
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
});
