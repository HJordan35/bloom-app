import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, fonts, space } from "../theme/tokens.stylex";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div {...stylex.props(styles.wrap)}>
      <span {...stylex.props(styles.rule)} />
      <p {...stylex.props(styles.title)}>{title}</p>
      {children && <p {...stylex.props(styles.body)}>{children}</p>}
    </div>
  );
}

const styles = stylex.create({
  wrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space.sm,
    paddingBlock: space.xl,
    textAlign: "center",
  },
  rule: {
    width: 32,
    height: 1,
    backgroundColor: colors.brass,
    marginBottom: space.sm,
  },
  title: {
    fontFamily: fonts.display,
    fontStyle: "italic",
    fontSize: 20,
  },
  body: {
    maxWidth: 280,
    fontSize: 13,
    color: colors.muted,
  },
});
