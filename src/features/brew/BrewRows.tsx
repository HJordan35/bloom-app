import * as stylex from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { Avatar } from "../../components/Avatar";
import { LiveDot } from "../../components/LiveDot";
import { useCurrentBro } from "../../lib/auth";
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

/** The start of a brew's or recipe's notes on one quiet line, to tell rows apart. */
export function NotesLine({ notes }: { notes: string | null }) {
  // Line breaks would only be cut off; read it as one run of text
  const text = notes?.replace(/\s+/g, " ").trim();
  return <span {...stylex.props(styles.notes)}>{text || "No notes"}</span>;
}

/**
 * A finished brew, linking to its page. `showBro` leads with the bro's avatar (for shared
 * lists); `notes` adds a line of its brew notes (browsing); `onClick` makes it a
 * button instead (picking a brew in a sheet).
 */
export function BrewRow({
  brew,
  showBro = false,
  notes = false,
  onClick,
}: {
  brew: BrewWithRoast;
  showBro?: boolean;
  notes?: boolean;
  onClick?: () => void;
}) {
  const me = useCurrentBro();
  const content = (
    <>
      {showBro && <Avatar bro={brew.bro} size="xs" self={brew.bro_id === me.id} />}
      <div {...stylex.props(styles.main)}>
        <span>
          {brew.roast.name}
          {brew.dialed_in && <span {...stylex.props(styles.dialed)}> ✦</span>}
        </span>
        <span {...stylex.props(styles.meta)}>
          {brew.roast.roaster.name} · {brew.method}
        </span>
        {notes && <NotesLine notes={brew.brew_notes} />}
        {resultsPending(brew) && <span {...stylex.props(styles.pending)}>Results pending</span>}
      </div>
      <span {...stylex.props(styles.side)}>
        {relativeDate(brew.finished_at ?? brew.started_at)}
      </span>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} {...stylex.props(styles.button, styles.row)}>
      {content}
    </button>
  ) : (
    <Link to={`/brews/${brew.id}`} {...stylex.props(styles.row)}>
      {content}
    </Link>
  );
}

const styles = stylex.create({
  // Undoes the button look; row (applied after) draws the divider
  button: {
    width: "100%",
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    color: colors.text,
    font: "inherit",
    textAlign: "left",
    cursor: "pointer",
  },
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
  dialed: {
    color: colors.brass,
  },
  notes: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 12,
    fontStyle: "italic",
    color: colors.muted,
  },
  side: {
    flexShrink: 0,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
  },
  pending: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: colors.faint,
  },
});
