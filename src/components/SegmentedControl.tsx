import * as stylex from "@stylexjs/stylex";
import { colors, radius } from "../theme/tokens.stylex";

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div {...stylex.props(styles.wrap)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          {...stylex.props(styles.segment, option.value === value && styles.active)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const styles = stylex.create({
  wrap: {
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "1fr",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.sm,
  },
  segment: {
    minHeight: 40,
    backgroundColor: "transparent",
    borderWidth: 0,
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: colors.muted,
    cursor: "pointer",
    transition: "color 150ms, background-color 150ms",
  },
  active: {
    backgroundColor: colors.surfaceRaised,
    color: colors.brass,
  },
});
