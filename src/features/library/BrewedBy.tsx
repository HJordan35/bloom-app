import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { byId } from "../../api/api.utils";
import { broQueries } from "../../api/bros/bros.queries";
import { AvatarStack } from "../../components/AvatarStack";
import { useCurrentBro } from "../../lib/auth";
import type { Ranking } from "../../lib/types";
import { colors, fonts, space } from "../../theme/tokens.stylex";

type Props = {
  ranking?: Ranking;
  max?: number;
  /** Detail pages: a "Brewed by" label and the names beside the avatars. */
  labelled?: boolean;
};

/** Avatars of every bro who has brewed a roast or roaster, from its ranking's `brewed_by`. */
export function BrewedBy({ ranking, max, labelled = false }: Props) {
  const me = useCurrentBro();
  const { data: brosById } = useQuery({ ...broQueries.list(), select: byId });
  const bros = (ranking?.brewed_by ?? []).flatMap((id) => brosById?.get(id) ?? []);
  const stack = (
    <AvatarStack bros={bros} selfId={me.id} max={max} on={labelled ? "page" : "surface"} />
  );
  if (!labelled) return stack;

  const names = bros
    .map((b) => (b.id === me.id ? "You" : b.first_name))
    .sort((a, b) => Number(b === "You") - Number(a === "You") || a.localeCompare(b))
    .join(", ");

  return (
    <div {...stylex.props(styles.row)}>
      <span {...stylex.props(styles.label)}>Brewed by</span>
      {bros.length > 0 ? (
        <>
          {stack}
          <span {...stylex.props(styles.names)}>{names}</span>
        </>
      ) : (
        <span {...stylex.props(styles.names)}>Nobody yet</span>
      )}
    </div>
  );
}

const styles = stylex.create({
  row: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.md,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.muted,
  },
  names: {
    minWidth: 0,
    fontSize: 12,
    color: colors.muted,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});
