import * as stylex from "@stylexjs/stylex";
import { colors, fonts, radius, space } from "../theme/tokens.stylex";

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
};

/** 1–10 picker. Tapping the selected value clears it. */
export function RatingInput({ value, onChange }: Props) {
  return (
    <div {...stylex.props(styles.grid)}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? null : n)}
          {...stylex.props(
            styles.cell,
            value != null && n <= value && styles.filled,
            n === value && styles.selected,
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: space.xs,
  },
  cell: {
    height: 44,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.muted,
    cursor: "pointer",
  },
  filled: {
    borderColor: colors.leather,
    color: colors.text,
  },
  selected: {
    borderColor: colors.brass,
    color: colors.brass,
  },
});
