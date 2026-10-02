import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, fonts, space } from "../theme/tokens.stylex";

type Props = {
  label: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Section({ label, action, children }: Props) {
  return (
    <section {...stylex.props(styles.section)}>
      <header {...stylex.props(styles.header)}>
        <h3 {...stylex.props(styles.label)}>{label}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

const styles = stylex.create({
  section: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  label: {
    fontFamily: fonts.mono,
    fontWeight: 400,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.muted,
  },
});
