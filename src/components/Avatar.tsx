import * as stylex from "@stylexjs/stylex";
import type { Bro } from "../api/bros/bros.types";
import { colors, fonts } from "../theme/tokens.stylex";
import { LiveDot } from "./LiveDot";

type Props = {
  bro: Pick<Bro, "first_name" | "last_name">;
  size?: "xs" | "sm" | "lg";
  live?: boolean;
  /** The logged-in bro: brass ring and initials, to tell "you" apart in a group. */
  self?: boolean;
  /** Picked in a filter: the same brass treatment as a selected chip. */
  selected?: boolean;
};

export function Avatar({ bro, size = "sm", live = false, self = false, selected = false }: Props) {
  return (
    <span
      {...stylex.props(
        styles.avatar,
        styles[size],
        (self || selected) && styles.self,
        live && styles.live,
      )}
    >
      {bro.first_name[0]}
      {bro.last_name[0]}
      {live && size === "lg" && (
        <span {...stylex.props(styles.dot)}>
          <LiveDot />
        </span>
      )}
    </span>
  );
}

const styles = stylex.create({
  avatar: {
    position: "relative",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    fontFamily: fonts.display,
    color: colors.text,
    textTransform: "uppercase",
  },
  xs: {
    width: 22,
    height: 22,
    fontSize: 10,
  },
  sm: {
    width: 30,
    height: 30,
    fontSize: 12,
  },
  lg: {
    width: 56,
    height: 56,
    fontSize: 20,
  },
  self: {
    borderColor: colors.brass,
    color: colors.brass,
  },
  live: {
    borderColor: colors.ember,
  },
  dot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    display: "flex",
  },
});
