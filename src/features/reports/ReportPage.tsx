import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { byId } from "../../api/api.utils";
import { broQueries } from "../../api/bros/bros.queries";
import type { Bro } from "../../api/bros/bros.types";
import { reportMutations, reportQueries } from "../../api/reports/reports.queries";
import type { Insight, MonthlyStats } from "../../api/reports/reports.types";
import { Avatar } from "../../components/Avatar";
import { DetailHeader } from "../../components/DetailHeader";
import { EmptyState } from "../../components/EmptyState";
import { FadeIn } from "../../components/FadeIn";
import { Section } from "../../components/Section";
import { StatStrip } from "../../components/StatStrip";
import { useCurrentBro } from "../../lib/auth";
import { monthTitle, volume, weight } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { InsightCard } from "./InsightCard";

export function ReportPage() {
  const { month = "" } = useParams();
  const me = useCurrentBro();
  const { data: stats } = useQuery(reportQueries.stats(month));
  const { data: insights } = useQuery(reportQueries.insights(month));
  const { data: bros } = useQuery({ ...broQueries.list(), select: byId });

  // Opening the report marks it read, which clears the top bar's badge
  const { mutate: markViewed } = useMutation(reportMutations.markViewed());
  useEffect(() => markViewed({ broId: me.id, month }), [markViewed, me.id, month]);

  if (!stats || !insights || !bros) return null;
  const { totals } = stats;

  if (totals.brews === 0 && insights.size === 0) {
    return <EmptyState title={`No report for ${monthTitle(month)}.`} />;
  }

  const brewing = stats.bros.filter((b) => b.brews > 0).length;
  const meta = [
    `${brewing} ${brewing === 1 ? "bro" : "bros"}`,
    `${totals.brews} brews`,
    totals.roasters > 0 &&
      `${totals.roasters} new ${totals.roasters === 1 ? "roaster" : "roasters"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <FadeIn xstyle={styles.page}>
      <DetailHeader eyebrow="Monthly report" title={monthTitle(month)} meta={meta} />

      <StatStrip
        stats={[
          ["Brews", totals.brews],
          ["Volume", volume(totals.volume_ml)],
          ["Beans", weight(totals.beans_g)],
          ["Dial-ins", totals.dialed_in],
          ["Tried", totals.roasts_tried],
          ["Firsts", totals.first_tries],
          ["New roasts", totals.roasts],
          ["Endorsed", totals.endorsements],
        ]}
      />

      {stats.methods.length > 0 && (
        <Methods methods={stats.methods} total={totals.brews} bros={bros} />
      )}

      {stats.bros.map((numbers) => {
        const bro = bros.get(numbers.bro_id);
        if (!bro) return null;
        return (
          <BroSection
            key={bro.id}
            bro={bro}
            self={bro.id === me.id}
            numbers={numbers}
            insights={insights.get(bro.id)}
          />
        );
      })}
    </FadeIn>
  );
}

/** Methods by brews, each with a bar for its share of the month and each bro's count. */
function Methods({
  methods,
  total,
  bros,
}: {
  methods: MonthlyStats["methods"];
  total: number;
  bros: Map<string, Bro>;
}) {
  return (
    <Section label="Methods">
      {methods.map((m) => (
        <div key={m.method} {...stylex.props(styles.method)}>
          <div {...stylex.props(styles.methodLine)}>
            <span {...stylex.props(styles.methodName)}>{m.method}</span>
            <span {...stylex.props(styles.count)}>{m.brews}</span>
          </div>
          <div {...stylex.props(styles.track)}>
            <div {...stylex.props(styles.bar(m.brews / total))} />
          </div>
          <div {...stylex.props(styles.shares)}>
            {m.by_bro.map(({ bro_id, brews }) => {
              const bro = bros.get(bro_id);
              return (
                bro && (
                  <span key={bro_id} {...stylex.props(styles.share)}>
                    <Avatar bro={bro} size="xs" />
                    {brews}
                  </span>
                )
              );
            })}
          </div>
        </div>
      ))}
    </Section>
  );
}

function BroSection({
  bro,
  self,
  numbers,
  insights,
}: {
  bro: Bro;
  self: boolean;
  numbers: MonthlyStats["bros"][number];
  insights?: Insight[];
}) {
  return (
    <section {...stylex.props(styles.bro)}>
      <Link to={`/bros/${bro.id}`} {...stylex.props(styles.broHeader)}>
        <Avatar bro={bro} self={self} />
        <h3 {...stylex.props(styles.broName)}>{bro.first_name}</h3>
      </Link>
      <StatStrip
        stats={[
          ["Brews", numbers.brews],
          ["Volume", volume(numbers.volume_ml)],
          ["Dial-ins", numbers.dialed_in],
          ["Firsts", numbers.first_tries],
        ]}
      />
      {insights?.length ? (
        insights.map((insight) => <InsightCard key={insight.position} insight={insight} />)
      ) : (
        <p {...stylex.props(styles.none)}>No insights this month.</p>
      )}
    </section>
  );
}

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  method: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
    paddingBlock: space.xs,
  },
  methodLine: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space.md,
  },
  methodName: {
    fontFamily: fonts.display,
    fontSize: 16,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: 14,
  },
  track: {
    height: 2,
    backgroundColor: colors.hairline,
  },
  bar: (share: number) => ({
    width: `${share * 100}%`,
    height: "100%",
    backgroundColor: colors.brass,
  }),
  shares: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.md,
    paddingTop: 2,
  },
  share: {
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
  },
  bro: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },
  broHeader: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    alignSelf: "flex-start",
  },
  broName: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 22,
  },
  none: {
    fontSize: 13,
    color: colors.muted,
  },
});
