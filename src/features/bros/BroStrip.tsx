import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { brewQueries } from "../../api/brews/brews.queries";
import { broQueries } from "../../api/bros/bros.queries";
import { Avatar } from "../../components/Avatar";
import { useCurrentBro } from "../../lib/auth";
import { broLabel, youFirst } from "../../lib/bros";
import { colors, fonts, space } from "../../theme/tokens.stylex";

const brewingBroIds = (brews: { bro_id: string }[]) => new Set(brews.map((b) => b.bro_id));

/**
 * Every bro, you first, to switch whose profile is showing. From your own (the Bros tab) it
 * opens theirs with Back; from theirs it swaps in place, so Back still returns where you came from.
 */
export function BroStrip({ selectedId }: { selectedId: string }) {
  const me = useCurrentBro();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { data: bros } = useQuery(broQueries.list());
  const { data: brewing } = useQuery({ ...brewQueries.brewingNow(), select: brewingBroIds });
  if (!bros || !brewing) return null;

  return (
    <nav {...stylex.props(styles.strip)}>
      {[...bros].sort(youFirst(me.id)).map((bro) => {
        const selected = bro.id === selectedId;
        return (
          <button
            key={bro.id}
            type="button"
            aria-current={selected}
            onClick={() => !selected && navigate(`/bros/${bro.id}`, { replace: !!routeId })}
            {...stylex.props(styles.bro)}
          >
            <Avatar bro={bro} selected={selected} live={brewing.has(bro.id)} />
            <span {...stylex.props(styles.name, selected && styles.selectedName)}>
              {broLabel(bro, me.id)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = stylex.create({
  strip: {
    display: "flex",
    gap: space.md,
    overflowX: "auto",
    marginInline: `calc(-1 * ${space.md})`,
    paddingInline: space.md,
    scrollbarWidth: "none",
  },
  bro: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space.xs,
    minWidth: 44,
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    cursor: "pointer",
  },
  name: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: colors.faint,
  },
  selectedName: {
    color: colors.brass,
  },
});
