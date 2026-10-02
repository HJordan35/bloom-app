import * as stylex from "@stylexjs/stylex";
import { colors, space } from "../theme/tokens.stylex";

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Toggle({ label, checked, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      {...stylex.props(styles.row)}
    >
      <span>{label}</span>
      <span {...stylex.props(styles.track, checked && styles.trackOn)}>
        <span {...stylex.props(styles.thumb, checked && styles.thumbOn)} />
      </span>
    </button>
  );
}

const styles = stylex.create({
  row: {
    minHeight: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    backgroundColor: "transparent",
    borderWidth: 0,
    textAlign: "left",
    cursor: "pointer",
  },
  track: {
    position: "relative",
    width: 40,
    height: 22,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: 11,
    transition: "border-color 150ms",
  },
  trackOn: {
    borderColor: colors.brass,
  },
  thumb: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 14,
    height: 14,
    borderRadius: "50%",
    backgroundColor: colors.muted,
    transition: "transform 150ms, background-color 150ms",
  },
  thumbOn: {
    transform: "translateX(18px)",
    backgroundColor: colors.brass,
  },
});
