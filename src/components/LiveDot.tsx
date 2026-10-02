import * as stylex from "@stylexjs/stylex";
import { colors } from "../theme/tokens.stylex";

export function LiveDot() {
  return <span role="img" aria-label="Brewing now" {...stylex.props(styles.dot)} />;
}

const pulse = stylex.keyframes({
  "0%": { boxShadow: "0 0 0 0 rgba(200, 100, 47, 0.6)" },
  "70%": { boxShadow: "0 0 0 8px rgba(200, 100, 47, 0)" },
  "100%": { boxShadow: "0 0 0 0 rgba(200, 100, 47, 0)" },
});

const styles = stylex.create({
  dot: {
    flexShrink: 0,
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: colors.ember,
    animationName: pulse,
    animationDuration: "2s",
    animationIterationCount: "infinite",
  },
});
