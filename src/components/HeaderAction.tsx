import * as stylex from "@stylexjs/stylex";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { colors, fonts } from "../theme/tokens.stylex";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { icon?: ReactNode };

/** A quiet brass action for a header row: small caps, optional leading icon. */
export function HeaderAction({ icon, children, ...props }: Props) {
  return (
    <button type="button" {...props} {...stylex.props(styles.action)}>
      {icon}
      {children}
    </button>
  );
}

const styles = stylex.create({
  action: {
    // A 44px target that overhangs the row rather than pushing it taller
    marginBlock: -14,
    minHeight: 44,
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
    cursor: "pointer",
  },
});
