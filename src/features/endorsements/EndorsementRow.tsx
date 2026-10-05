import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Button } from "../../components/Button";
import { useCurrentBro } from "../../lib/auth";
import { relativeDate } from "../../lib/format";
import type { EndorsementWithRoast } from "../../lib/types";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { EndorsementSheet } from "./EndorsementSheet";

type Props = {
  endorsement: EndorsementWithRoast;
  showRoast?: boolean;
  /** Called after the owner edits it, so the page can reload. */
  onChanged: () => void;
};

export function EndorsementRow({ endorsement: e, showRoast = false, onChanged }: Props) {
  const bro = useCurrentBro();
  const [editing, setEditing] = useState(false);

  return (
    <div {...stylex.props(styles.row)}>
      <div {...stylex.props(styles.main)}>
        <span {...stylex.props(styles.meta)}>
          {[e.bro.first_name, showRoast && e.roast.name, e.method, relativeDate(e.created_at)]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {e.note && <p {...stylex.props(styles.note)}>{e.note}</p>}
        {e.bro_id === bro.id && (
          <span {...stylex.props(styles.edit)}>
            <Button variant="text" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </span>
        )}
      </div>
      {e.rating != null && <span {...stylex.props(styles.rating)}>{e.rating}</span>}

      {editing && (
        <EndorsementSheet
          roast={e.roast}
          endorsement={e}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

const styles = stylex.create({
  row: {
    minHeight: 60,
    display: "flex",
    alignItems: "flex-start",
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
    gap: 2,
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "capitalize",
  },
  note: {
    whiteSpace: "pre-wrap",
  },
  edit: {
    marginBlock: -8,
  },
  rating: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.brass,
  },
});
