import * as stylex from "@stylexjs/stylex";
import type { Ranking } from "../api/rankings/rankings.types";
import { brewPart, isRanked, NEUTRAL_RATING, ratingPart } from "../lib/ranking";
import { colors, fonts, space } from "../theme/tokens.stylex";
import { Sheet } from "./Sheet";

type Props = {
  title: string;
  ranking?: Ranking;
  onClose: () => void;
};

/** Explains a score using the item's own numbers. */
export function RankingSheet({ title, ranking, onClose }: Props) {
  return (
    <Sheet title={title} onClose={onClose}>
      {isRanked(ranking) ? (
        <dl {...stylex.props(styles.rows)}>
          <Row
            label="Rating"
            value={ratingPart(ranking)}
            detail={
              ranking.avg_rating != null
                ? `Average of each bro's latest rating per method · ${ranking.rating_count} ${ranking.rating_count === 1 ? "rating" : "ratings"}`
                : `No ratings yet, so a neutral ${NEUTRAL_RATING}`
            }
          />
          <Row
            label="Brews"
            value={brewPart(ranking)}
            detail={`3 × ln(1 + ${ranking.brew_count} ${ranking.brew_count === 1 ? "brew" : "brews"}), capped at 10`}
          />
          <Row label="Score" value={ranking.score} detail="Half rating, half brews" total />
        </dl>
      ) : (
        <p {...stylex.props(styles.text)}>
          Not ranked yet. It gets a score after its first brew or rating.
        </p>
      )}
      <p {...stylex.props(styles.text)}>
        Brewing a roast often raises its score even without ratings. Ratings tilt it up or down.
      </p>
    </Sheet>
  );
}

function Row({
  label,
  value,
  detail,
  total = false,
}: {
  label: string;
  value: number;
  detail: string;
  total?: boolean;
}) {
  return (
    <div {...stylex.props(styles.row, total && styles.totalRow)}>
      <dt {...stylex.props(styles.label)}>{label}</dt>
      <dd {...stylex.props(styles.value, total && styles.totalValue)}>{value.toFixed(1)}</dd>
      <dd {...stylex.props(styles.detail)}>{detail}</dd>
    </div>
  );
}

const styles = stylex.create({
  rows: {
    display: "flex",
    flexDirection: "column",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    rowGap: 2,
    paddingBlock: space.md,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  totalRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.muted,
    alignSelf: "center",
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 20,
    textAlign: "right",
  },
  totalValue: {
    fontSize: 28,
    color: colors.brass,
  },
  detail: {
    gridColumn: "1 / -1",
    fontSize: 12,
    color: colors.muted,
  },
  text: {
    fontSize: 13,
    color: colors.muted,
  },
});
