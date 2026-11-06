import * as stylex from "@stylexjs/stylex";
import { colors, radius, space } from "../theme/tokens.stylex";
import { BookmarkIcon } from "./icons";

type Props = {
  options: readonly string[];
  /** One choice, or several (multi-select: the caller toggles the tapped option). */
  value: string | null | readonly string[];
  /** Called with the tapped option. */
  onChange: (value: string) => void;
  /** Options to flag with a small bookmark (e.g. methods with a preferred recipe). */
  marked?: readonly string[];
};

export function Chips({ options, value, onChange, marked }: Props) {
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
          {marked?.includes(option) && (
            <span {...stylex.props(styles.mark)}>
              <BookmarkIcon />
            </span>
          )}
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
  mark: {
    display: "inline-flex",
    marginRight: 6,
    verticalAlign: "-2px",
    color: colors.brass,
  },
  selected: {
    borderColor: colors.brass,
    color: colors.brass,
  },
});
