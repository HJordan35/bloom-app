import * as stylex from "@stylexjs/stylex";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { dayHeading } from "../../lib/format";
import { supabase } from "../../lib/supabase";
import { useData } from "../../lib/useData";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { fetchBoard } from "./api";
import { EventRow } from "./EventRow";

const LIVE_TABLES = ["brews", "roasters", "roasts", "endorsements"];

export function BrosBoardPage() {
  const me = useCurrentBro();
  const { data: board, reload } = useData(fetchBoard, []);

  // Any change to an event table refreshes the board
  useEffect(() => {
    const channel = supabase.channel(`board-${crypto.randomUUID()}`);
    for (const table of LIVE_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, reload);
    }
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload]);

  if (!board) return null;
  const bros = [...board.bros].sort((a, b) => Number(b.id === me.id) - Number(a.id === me.id));

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.strip)}>
        {bros.map((bro) => (
          <Link key={bro.id} to={`/bros/${bro.id}`} {...stylex.props(styles.bro)}>
            <Avatar bro={bro} size="lg" live={board.brewingBroIds.has(bro.id)} />
            <span {...stylex.props(styles.broName)}>
              {bro.id === me.id ? "You" : bro.first_name}
            </span>
          </Link>
        ))}
      </div>

      {board.events.length === 0 ? (
        <EmptyState title="Quiet in the lounge.">
          Brews, roasts and endorsements land here.
        </EmptyState>
      ) : (
        groupByDay(board.events).map(([day, events]) => (
          <Section key={day} label={day}>
            {events.map((e) => (
              <EventRow key={`${e.type}-${e.ref_id}`} event={e} board={board} />
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
