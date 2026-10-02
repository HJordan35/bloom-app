import * as stylex from "@stylexjs/stylex";
import type { InputHTMLAttributes } from "react";
import { colors, fonts, space } from "../theme/tokens.stylex";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Field({ label, ...props }: Props) {
  return (
    <label {...stylex.props(styles.field)}>
      <span {...stylex.props(styles.label)}>{label}</span>
      <input {...props} {...stylex.props(styles.input)} />
    </label>
  );
}

const styles = stylex.create({
  field: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.muted,
  },
  input: {
    height: 44,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.hairline, ":focus": colors.brass },
    outline: "none",
    fontSize: 16, // 16px prevents iOS zoom on focus
    transition: "border-color 150ms",
  },
});
