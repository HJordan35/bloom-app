import * as stylex from "@stylexjs/stylex";
import { colors } from "../theme/tokens.stylex";

/** A 1–10 rating as ten dots, filled to the rounded rating; all empty when unrated. */
export function RatingDots({ rating }: { rating: number | null | undefined }) {
  const filled = rating == null ? 0 : Math.round(rating);
  return (
    <span
      role="img"
      aria-label={rating == null ? "Unrated" : `Rated ${rating.toFixed(1)} of 10`}
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
