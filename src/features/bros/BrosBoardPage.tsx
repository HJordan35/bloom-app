import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { brewKeys, brewQueries } from "../../api/brews/brews.queries";
import { broQueries } from "../../api/bros/bros.queries";
import { eventKeys, eventQueries } from "../../api/events/events.queries";
import { queryClient } from "../../api/queryClient";
import { roasterKeys, roasterQueries } from "../../api/roasters/roasters.queries";
import { roastKeys, roastQueries } from "../../api/roasts/roasts.queries";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { dayHeading } from "../../lib/format";
import { useLive } from "../../lib/useLive";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { EventRow } from "./EventRow";

const LIVE_TABLES = ["brews", "roasters", "roasts", "endorsements"];

/** Any change to an event table refreshes what the board shows. */
function refreshBoard() {
  for (const queryKey of [eventKeys.all, brewKeys.brewingNow(), roastKeys.all, roasterKeys.all]) {
    queryClient.invalidateQueries({ queryKey });
  }
}

const brewingBroIds = (brews: { bro_id: string }[]) => new Set(brews.map((b) => b.bro_id));

export function BrosBoardPage() {
  const me = useCurrentBro();
  const { data: events } = useQuery(eventQueries.list());
  const { data: allBros } = useQuery(broQueries.list());
  const { data: brewing } = useQuery({ ...brewQueries.brewingNow(), select: brewingBroIds });
  // Event rows read these from the cache; waiting here keeps names from popping in
  const { data: roasts } = useQuery(roastQueries.list());
  const { data: roasters } = useQuery(roasterQueries.list());
  useLive(LIVE_TABLES, refreshBoard);

  if (!events || !allBros || !brewing || !roasts || !roasters) return null;
  const bros = [...allBros].sort((a, b) => Number(b.id === me.id) - Number(a.id === me.id));

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.strip)}>
        {bros.map((bro) => (
          <Link key={bro.id} to={`/bros/${bro.id}`} {...stylex.props(styles.bro)}>
            <Avatar bro={bro} size="lg" live={brewing.has(bro.id)} />
            <span {...stylex.props(styles.broName)}>
              {bro.id === me.id ? "You" : bro.first_name}
            </span>
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState title="Quiet in the lounge.">
          Brews, roasts and endorsements land here.
        </EmptyState>
      ) : (
        groupByDay(events).map(([day, events]) => (
          <Section key={day} label={day}>
            {events.map((e) => (
              <EventRow key={`${e.type}-${e.ref_id}`} event={e} />
            ))}
          </Section>
        ))
      )}
    </div>
  );
}

function groupByDay<T extends { created_at: string }>(items: T[]) {
  const groups: [string, T[]][] = [];
  for (const item of items) {
    const day = dayHeading(item.created_at);
    const last = groups.at(-1);
    if (last?.[0] === day) last[1].push(item);
    else groups.push([day, [item]]);
  }
  return groups;
}

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  strip: {
    display: "flex",
    gap: space.md,
    overflowX: "auto",
    marginInline: `calc(-1 * ${space.md})`,
    paddingInline: space.md,
    paddingBottom: space.sm,
    scrollbarWidth: "none",
  },
  bro: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space.xs,
    minWidth: 60,
  },
  broName: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: colors.muted,
  },
});
