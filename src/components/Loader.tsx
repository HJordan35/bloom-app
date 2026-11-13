import * as stylex from "@stylexjs/stylex";
import { colors } from "../theme/tokens.stylex";

/** A quiet wait: a short hairline with a brass glint passing along it. */
export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" aria-label={label} {...stylex.props(styles.track)}>
      <span {...stylex.props(styles.glint)} />
    </span>
  );
}

const pass = stylex.keyframes({
  "0%": { transform: "translateX(-100%)", opacity: 0 },
  "30%": { opacity: 1 },
  "70%": { opacity: 1 },
  "100%": { transform: "translateX(250%)", opacity: 0 },
});

const styles = stylex.create({
  track: {
    flexShrink: 0,
    display: "block",
    width: 40,
    height: 1,
    overflow: "hidden",
    backgroundColor: colors.hairline,
  },
  glint: {
    display: "block",
    width: "40%",
    height: "100%",
    backgroundColor: colors.brass,
    // Still under reduced motion: the brass mark alone says "waiting"
    animationName: { default: pass, "@media (prefers-reduced-motion: reduce)": "none" },
    animationDuration: "1.6s",
    animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    animationIterationCount: "infinite",
  },
});
