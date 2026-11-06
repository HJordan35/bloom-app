import * as stylex from "@stylexjs/stylex";
import { colors, radius, space } from "../theme/tokens.stylex";

type Props = {
  options: readonly string[];
  /** One choice, or several (multi-select: the caller toggles the tapped option). */
  value: string | null | readonly string[];
  /** Called with the tapped option. */
  onChange: (value: string) => void;
};

export function Chips({ options, value, onChange }: Props) {
  const selected = (option: string) =>
    Array.isArray(value) ? value.includes(option) : option === value;
  return (
    <div {...stylex.props(styles.row)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={selected(option)}
          onClick={() => onChange(option)}
          {...stylex.props(styles.chip, selected(option) && styles.selected)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

const styles = stylex.create({
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.sm,
  },
  chip: {
    minHeight: 40,
    paddingInline: 14,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    color: colors.muted,
    fontSize: 13,
    textTransform: "capitalize",
    cursor: "pointer",
    transition: "border-color 150ms, color 150ms",
  },
  selected: {
    borderColor: colors.brass,
    color: colors.brass,
  },
});
