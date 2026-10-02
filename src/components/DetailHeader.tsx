import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, fonts, space } from "../theme/tokens.stylex";

type Props = {
  eyebrow: ReactNode;
  title: string;
  meta?: ReactNode;
  children?: ReactNode;
};

export function DetailHeader({ eyebrow, title, meta, children }: Props) {
  return (
    <header {...stylex.props(styles.header)}>
      <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>
      <h2 {...stylex.props(styles.title)}>{title}</h2>
      {meta && <p {...stylex.props(styles.meta)}>{meta}</p>}
      {children && <div {...stylex.props(styles.extra)}>{children}</div>}
    </header>
  );
}

const styles = stylex.create({
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 30,
    lineHeight: 1.15,
  },
  meta: {
    fontSize: 13,
    color: colors.muted,
    textTransform: "capitalize",
  },
  extra: {
    marginTop: space.md,
  },
});
