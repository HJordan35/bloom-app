import * as stylex from "@stylexjs/stylex";
import { Fragment } from "react";
import { colors, fonts } from "../theme/tokens.stylex";

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** A light inline switch, "Recipes · Brews": the chosen option in full text, the rest muted. */
export function TextToggle<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div {...stylex.props(styles.row)}>
      {options.map((option, i) => (
        <Fragment key={option.value}>
          {i > 0 && <span {...stylex.props(styles.dot)}>·</span>}
          <button
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            {...stylex.props(styles.option, option.value === value && styles.active)}
          >
            {option.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  option: {
    // A 44px target that overhangs the row, like HeaderAction
    marginBlock: -14,
    minHeight: 44,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.muted,
    cursor: "pointer",
    transition: "color 150ms",
  },
  active: {
    color: colors.text,
  },
  dot: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.faint,
  },
});
