import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { brewQueries } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { broQueries } from "../../api/bros/bros.queries";
import { endorsementQueries } from "../../api/endorsements/endorsements.queries";
import { byRoastId, rankingQueries } from "../../api/rankings/rankings.queries";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { LiveDot } from "../../components/LiveDot";
import { Mosaic, Tile } from "../../components/Mosaic";
import { Section } from "../../components/Section";
import { useAuth, useCurrentBro } from "../../lib/auth";
import { elapsed } from "../../lib/format";
import { useNow } from "../../lib/useNow";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { isLive } from "../brew/api";
import { BrewRow } from "../brew/BrewRows";
import { EndorsementRow } from "../endorsements/EndorsementRow";
import { NotificationsToggle } from "./NotificationsToggle";

/** Their roasts with how many times they've brewed each, most brewed first. */
function libraryOf(brews: BrewWithRoast[]) {
  const counts = new Map<string, { roast: RoastWithRoaster; count: number }>();
  for (const b of brews) {
    const entry = counts.get(b.roast_id) ?? { roast: b.roast, count: 0 };
    entry.count++;
    counts.set(b.roast_id, entry);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

function favouriteMethod(brews: BrewWithRoast[]) {
  const counts = new Map<string, number>();
  for (const b of brews) counts.set(b.method, (counts.get(b.method) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}

export function BroProfilePage() {
  const { id = "" } = useParams();
  const me = useCurrentBro();
  const { logout } = useAuth();
  const now = useNow();
  const { data: bro } = useQuery(broQueries.detail(id));
  const { data: brews } = useQuery(brewQueries.forBro(id));
  const { data: endorsements } = useQuery(endorsementQueries.list({ broId: id }));
  const { data: roastScores } = useQuery({ ...rankingQueries.roasts(), select: byRoastId });
  if (!bro || !brews || !endorsements || !roastScores) return null;

  const live = brews.find(isLive);
  const library = libraryOf(brews);
  const stats: [string, string | number][] = [
    ["Brews", brews.length],
    ["Roasts", library.length],
    ["Endorsed", endorsements.length],
    ["Dialed in", brews.filter((b) => b.dialed_in).length],
  ];

  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <Avatar bro={bro} size="lg" live={!!live} />
        <div>
          <h2 {...stylex.props(styles.name)}>
            {bro.first_name} {bro.last_name}
          </h2>
          <p {...stylex.props(styles.favourite)}>Favours {favouriteMethod(brews)}</p>
        </div>
      </header>

      {live && (
        <Link to={`/brews/${live.id}`} {...stylex.props(styles.live)}>
          <LiveDot />
          <span {...stylex.props(styles.liveText)}>
            Brewing <em {...stylex.props(styles.roast)}>{live.roast.name}</em> · {live.method}
          </span>
          <span {...stylex.props(styles.timer)}>{elapsed(live.started_at, now)}</span>
        </Link>
      )}

      <dl {...stylex.props(styles.stats)}>
        {stats.map(([label, value]) => (
          <div key={label} {...stylex.props(styles.stat)}>
            <dt {...stylex.props(styles.statLabel)}>{label}</dt>
            <dd {...stylex.props(styles.statValue)}>{value}</dd>
          </div>
        ))}
      </dl>

      <Section label="Library">
        {library.length === 0 ? (
          <EmptyState title="Nothing brewed yet." />
        ) : (
          <Mosaic>
            {library.map(({ roast, count }) => (
              <Tile
                key={roast.id}
                to={`/library/roasts/${roast.id}`}
                title={roast.name}
                lines={[roast.roaster.name, roast.roast_level]}
                level={roast.roast_level}
                ranking={roastScores.get(roast.id)}
                caption={`${count} by ${bro.first_name}`}
              />
            ))}
          </Mosaic>
        )}
      </Section>

      {brews.some((b) => b.finished_at) && (
        <Section label="Recent brews">
          {brews
            .filter((b) => b.finished_at)
            .slice(0, 20)
            .map((brew) => (
              <BrewRow key={brew.id} brew={brew} />
            ))}
        </Section>
      )}

      {endorsements.length > 0 && (
        <Section label="Endorsements">
          {endorsements.slice(0, 10).map((e) => (
            <EndorsementRow key={e.id} endorsement={e} showRoast />
          ))}
        </Section>
      )}

      {bro.id === me.id && (
        <>
          <NotificationsToggle />
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </>
      )}
    </div>
  );
}

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: space.md,
  },
  name: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 26,
    lineHeight: 1.2,
  },
  favourite: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  live: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    padding: space.md,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.leather,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  liveText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.muted,
  },
  roast: {
    fontFamily: fonts.display,
    color: colors.text,
  },
  timer: {
    fontFamily: fonts.mono,
    fontSize: 14,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderInlineWidth: 0,
    borderStyle: "solid",
    borderColor: colors.hairline,
    paddingBlock: space.md,
  },
  stat: {
    display: "flex",
    flexDirection: "column-reverse", // value above label, dt first in markup
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 22,
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: colors.muted,
  },
});
