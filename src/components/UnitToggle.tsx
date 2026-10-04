import * as stylex from "@stylexjs/stylex";
import { colors, fonts } from "../theme/tokens.stylex";

type Props<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  format?: (option: T) => string;
};

/** Borderless text toggle for units, e.g. °F / °C inside a field. */
export function UnitToggle<T extends string>({
  options,
  value,
  onChange,
  format = String,
}: Props<T>) {
  return (
    <span {...stylex.props(styles.wrap)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          {...stylex.props(styles.option, option === value && styles.active)}
        >
          {format(option)}
        </button>
      ))}
    </span>
  );
}

const styles = stylex.create({
  wrap: {
    display: "flex",
    flexShrink: 0,
  },
  option: {
    minWidth: 32,
    minHeight: 44,
    backgroundColor: "transparent",
    borderWidth: 0,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.faint,
    cursor: "pointer",
    transition: "color 150ms",
  },
  active: {
    color: colors.brass,
  },
});
