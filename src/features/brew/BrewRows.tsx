import * as stylex from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { LiveDot } from "../../components/LiveDot";
import { elapsed, relativeDate } from "../../lib/format";
import { useNow } from "../../lib/useNow";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { resultsPending } from "./api";

export function LiveBrewRow({ brew }: { brew: BrewWithRoast }) {
  const now = useNow();
  return (
    <div {...stylex.props(styles.row)}>
      <LiveDot />
      <div {...stylex.props(styles.main)}>
        <span>{brew.bro.first_name}</span>
        <span {...stylex.props(styles.meta)}>
          {brew.roast.name} · {brew.method}
        </span>
      </div>
      <span {...stylex.props(styles.side)}>{elapsed(brew.started_at, now)}</span>
    </div>
  );
}

/** A finished brew. `showBro` swaps the roaster for the bro's name (for shared lists). */
export function BrewRow({ brew, showBro = false }: { brew: BrewWithRoast; showBro?: boolean }) {
  return (
    <Link to={`/brews/${brew.id}`} {...stylex.props(styles.row)}>
      <div {...stylex.props(styles.main)}>
        <span>
          {brew.roast.name}
          {brew.dialed_in && <span {...stylex.props(styles.dialed)}> ✦</span>}
        </span>
        <span {...stylex.props(styles.meta)}>
          {showBro ? brew.bro.first_name : brew.roast.roaster.name} · {brew.method}
        </span>
        {resultsPending(brew) && <span {...stylex.props(styles.pending)}>Results pending</span>}
      </div>
      <span {...stylex.props(styles.side)}>
        {relativeDate(brew.finished_at ?? brew.started_at)}
      </span>
    </Link>
  );
}

const styles = stylex.create({
  row: {
    minHeight: 60,
    display: "flex",
    alignItems: "center",
    gap: space.md,
    paddingBlock: space.sm,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  side: {
    flexShrink: 0,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
  },
  dialed: {
    color: colors.brass,
  },
  pending: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: colors.faint,
  },
});
