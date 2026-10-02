import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, radius, space } from "../theme/tokens.stylex";

export function Card({ children }: { children: ReactNode }) {
  return <div {...stylex.props(styles.card)}>{children}</div>;
}

const styles = stylex.create({
  card: {
    padding: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.md,
  },
});
