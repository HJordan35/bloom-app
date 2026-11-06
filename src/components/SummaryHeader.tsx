import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, fonts, space } from "../theme/tokens.stylex";

/**
 * The top of a brew or recipe summary: a brass eyebrow (who · what), an optional action at
 * its end, and the method as a title, with anything extra set beside it.
 */
export function SummaryHeader({
  eyebrow,
  action,
  children,
}: {
  eyebrow: ReactNode;
  action?: ReactNode;
  /** The title line. */
  children: ReactNode;
}) {
  return (
    <header {...stylex.props(styles.header)}>
      <div {...stylex.props(styles.top)}>
        <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>
        {action}
      </div>
      <p {...stylex.props(styles.title)}>{children}</p>
    </header>
  );
}

const styles = stylex.create({
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
  },
  top: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  title: {
    display: "flex",
    alignItems: "baseline",
    gap: space.md,
    fontFamily: fonts.display,
    fontSize: 22,
  },
});
