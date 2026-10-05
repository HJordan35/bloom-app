import * as stylex from "@stylexjs/stylex";
import type { Bro } from "../lib/types";
import { colors, fonts } from "../theme/tokens.stylex";
import { Avatar } from "./Avatar";

type Props = {
  bros: Bro[];
  /** The logged-in bro: listed first and highlighted. */
  selfId: string;
  max?: number;
  /** What it sits on, so the separating ring blends in: a tile (default) or the page. */
  on?: "surface" | "page";
};

/** Overlapping initials for a group of bros, you first, then "+N" past `max`. */
export function AvatarStack({ bros, selfId, max = 3, on = "surface" }: Props) {
  if (bros.length === 0) return null;
  const ordered = [...bros].sort(
    (a, b) =>
      Number(b.id === selfId) - Number(a.id === selfId) || a.first_name.localeCompare(b.first_name),
  );
  const shown = ordered.slice(0, max);
  const extra = ordered.length - shown.length;

  return (
    <span
      role="img"
      aria-label={`Brewed by ${ordered
        .map((b) => (b.id === selfId ? "you" : b.first_name))
        .join(", ")}`}
      {...stylex.props(styles.stack)}
    >
      {shown.map((bro, i) => (
        // Earlier avatars sit on top, so yours (first) is never covered
        <span
          key={bro.id}
          {...stylex.props(styles.item, on === "page" && styles.onPage, i > 0 && styles.overlap)}
          style={{ zIndex: shown.length - i }}
        >
          <Avatar bro={bro} size="xs" self={bro.id === selfId} />
        </span>
      ))}
      {extra > 0 && <span {...stylex.props(styles.extra)}>+{extra}</span>}
    </span>
  );
}

const styles = stylex.create({
  stack: {
    display: "inline-flex",
    alignItems: "center",
  },
  item: {
    position: "relative",
    display: "flex",
    borderRadius: "50%",
    // A ring in the tile colour separates overlapping avatars
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: colors.surface,
  },
  onPage: {
    borderColor: colors.bg,
  },
  overlap: {
    marginLeft: -4,
  },
  extra: {
    marginLeft: 6,
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 1,
    color: colors.muted,
  },
});
