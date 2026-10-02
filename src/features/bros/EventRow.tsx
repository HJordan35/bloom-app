import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar";
import { LiveDot } from "../../components/LiveDot";
import { clockTime } from "../../lib/format";
import type { BloomEvent } from "../../lib/types";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import type { Board } from "./api";

export function EventRow({ event: e, board }: { event: BloomEvent; board: Board }) {
  const bro = board.brosById.get(e.bro_id);
  const roast = e.roast_id ? board.roastsById.get(e.roast_id) : undefined;
  const roaster = e.roaster_id ? board.roastersById.get(e.roaster_id) : undefined;
  if (!bro) return null;

  const name = <strong {...stylex.props(styles.name)}>{bro.first_name}</strong>;
  const roastName = <em {...stylex.props(styles.subject)}>{roast?.name}</em>;
  const live = e.type === "brew" && board.brewingIds.has(e.ref_id);

  let to: string;
  let sentence: ReactNode;
  switch (e.type) {
    case "brew":
      to = `/brews/${e.ref_id}`;
      sentence = (
        <>
          {name} {live ? "is brewing" : "brewed"} {roastName} · {e.method}
        </>
      );
      break;
    case "roaster":
      to = `/library/roasters/${e.ref_id}`;
      sentence = (
        <>
          {name} added roaster <em {...stylex.props(styles.subject)}>{roaster?.name}</em>
        </>
      );
      break;
    case "roast":
      to = `/library/roasts/${e.ref_id}`;
      sentence = (
        <>
          {name} added {roastName} from {roaster?.name}
        </>
      );
      break;
    case "endorsement":
      to = `/library/roasts/${e.roast_id}`;
      sentence = (
        <>
          {name} {e.rating != null ? "endorsed" : "left a note on"} {roastName}
          {e.rating != null && <span {...stylex.props(styles.rating)}> {e.rating}</span>}
          {e.method && ` · ${e.method}`}
        </>
      );
      break;
  }

  return (
    <Link to={to} {...stylex.props(styles.row)}>
      <Avatar bro={bro} />
      <div {...stylex.props(styles.main)}>
        <p>{sentence}</p>
        {e.type === "endorsement" && e.note && <p {...stylex.props(styles.note)}>“{e.note}”</p>}
      </div>
      <span {...stylex.props(styles.side)}>{live ? <LiveDot /> : clockTime(e.created_at)}</span>
    </Link>
  );
}

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "flex-start",
    gap: space.md,
    paddingBlock: 12,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  main: {
    flex: 1,
    minWidth: 0,
    paddingTop: 4,
    fontSize: 14,
    color: colors.muted,
    overflowWrap: "anywhere",
  },
  name: {
    fontWeight: 500,
    color: colors.text,
  },
  subject: {
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.text,
  },
  rating: {
    fontFamily: fonts.mono,
    color: colors.brass,
  },
  note: {
    marginTop: space.xs,
    fontFamily: fonts.display,
    fontStyle: "italic",
    color: colors.text,
  },
  side: {
    flexShrink: 0,
    paddingTop: 6,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.faint,
  },
});
