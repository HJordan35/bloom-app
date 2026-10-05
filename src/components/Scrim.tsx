import * as stylex from "@stylexjs/stylex";

/** Darkens the lower half of a photo so text laid over it stays readable. */
export function Scrim() {
  return <span {...stylex.props(styles.scrim)} />;
}

const styles = stylex.create({
  // Fades to colors.bg (13, 10, 8)
  scrim: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage:
      "linear-gradient(to bottom, rgba(13, 10, 8, 0) 35%, rgba(13, 10, 8, 0.8) 62%, rgba(13, 10, 8, 0.95) 100%)",
  },
});
