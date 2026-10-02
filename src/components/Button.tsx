import * as stylex from "@stylexjs/stylex";
import type { ButtonHTMLAttributes } from "react";
import { colors, radius, space } from "../theme/tokens.stylex";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ variant = "primary", ...props }: Props) {
  return <button type="button" {...props} {...stylex.props(styles.base, styles[variant])} />;
}

const styles = stylex.create({
  base: {
    minHeight: 48,
    paddingInline: space.lg,
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: radius.sm,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "background-color 150ms, color 150ms, opacity 150ms",
    opacity: { default: 1, ":disabled": 0.5 },
  },
  primary: {
    backgroundColor: { default: "transparent", ":active": colors.brass },
    borderColor: colors.brass,
    color: { default: colors.brass, ":active": colors.bg },
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: colors.hairline,
    color: colors.muted,
  },
});
