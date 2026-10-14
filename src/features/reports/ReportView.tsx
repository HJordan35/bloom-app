import * as stylex from "@stylexjs/stylex";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { Bro } from "../../api/bros/bros.types";
import type {
  Insight,
  MonthlyStats,
  MonthNumbers,
  NewRoast,
} from "../../api/reports/reports.types";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { FadeIn } from "../../components/FadeIn";
import { Section } from "../../components/Section";
import { SegmentedControl } from "../../components/SegmentedControl";
import { volume, weight } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { BroCard } from "./BroCard";
import { broColors, LEATHER } from "./broColors";
import { HeadlineMosaic } from "./HeadlineMosaic";
import { Showcase } from "./Showcase";
import { StackedBars, type StackedRow } from "./StackedBars";

type Props = {
  /** "2026-09" */
  month: string;
  stats: MonthlyStats;
  /** Oldest first, ending with `stats`; trends start where brewing did. */
  history: MonthlyStats[];
  insights: Map<string, Insight[]>;
  /** The month's new coffees, and their showcase image (null before one is made). */
  newRoasts: NewRoast[];
  roastInsights: Map<string, Insight>;
  showcase: string | null;
  /** Every bro, for avatars and their colours. */
  bros: Bro[];
  meId: string;
};

const SHARES: [label: string, key: keyof MonthNumbers, format: (n: number) => string | number][] = [
  ["Brews", "brews", (n) => n],
  ["Volume", "volume_ml", volume],
  ["Beans", "beans_g", weight],
  ["Dialed in", "dialed_in", (n) => n],
  ["Firsts", "first_tries", (n) => n],
];

const TABS = [
  { value: "showcase", label: "Showcase" },
  { value: "stats", label: "Stats" },
  { value: "insights", label: "Insights" },
] as const;
type Tab = (typeof TABS)[number]["value"];

/** The Brewsletter: a masthead over three tabs — the new coffees, the numbers, and each bro's card. */
export function ReportView({
  month,
  stats,
  history,
  insights,
  newRoasts,
  roastInsights,
  showcase,
  bros,
  meId,
}: Props) {
  const colorOf = useMemo(() => broColors(bros), [bros]);
  const byId = useMemo(() => new Map(bros.map((b) => [b.id, b])), [bros]);
  const brewers = stats.bros.filter((b) => b.brews > 0);

  const shares = useMemo<StackedRow[]>(
    () =>
      SHARES.map(([label, key, format]) => ({
        label,
        total: format(Number(stats.totals[key])),
        parts: stats.bros.map((b) => ({ broId: b.bro_id, value: Number(b[key]) })),
      })),
    [stats],
  );
  const methods = useMemo<StackedRow[]>(
    () =>
      stats.methods.map((m) => ({
        label: m.method,
        total: m.brews,
        parts: m.by_bro.map((b) => ({ broId: b.bro_id, value: b.brews })),
      })),
    [stats],
  );

  // The tab lives in the URL, so a refresh, back-navigation or push link lands on it
  const [params, setParams] = useSearchParams();
  const tab: Tab =
    TABS.find((t) => t.value === params.get("tab"))?.value ??
    (newRoasts.length > 0 ? "showcase" : "stats");
  const chooseTab = (next: Tab) => setParams({ tab: next }, { replace: true });

  const [year, m] = month.split("-").map(Number);
  const monthName = new Date(year, m - 1).toLocaleDateString([], { month: "long" });

  return (
    <FadeIn xstyle={styles.page}>
      <header {...stylex.props(styles.masthead)}>
        <span {...stylex.props(styles.eyebrow)}>The Brewsletter</span>
        <h2 {...stylex.props(styles.title)}>
          {monthName}
          <span {...stylex.props(styles.year)}>{year}</span>
        </h2>
        <span {...stylex.props(styles.caption)}>
          {brewers.length} of {stats.bros.length} bros brewing
        </span>
      </header>

      <SegmentedControl options={[...TABS]} value={tab} onChange={chooseTab} />

      {/* Keyed by tab, so each switch plays the entrance again */}
      <FadeIn key={tab} xstyle={styles.page}>
        {tab === "showcase" &&
          (newRoasts.length > 0 ? (
            <Showcase
              image={showcase}
              roasts={newRoasts}
              insights={roastInsights}
              bros={byId}
              meId={meId}
            />
          ) : (
            <EmptyState title="No new coffees this month." />
          ))}

        {tab === "stats" && (
          <>
            <HeadlineMosaic stats={stats} history={history} />

            {brewers.length > 0 && (
              <Section
                label="Who did what"
                action={
                  <span {...stylex.props(styles.legend)}>
                    {brewers.map((b) => {
                      const bro = byId.get(b.bro_id);
                      return (
                        bro && (
                          <Avatar key={bro.id} bro={bro} size="xs" ring={colorOf.get(bro.id)} />
                        )
                      );
                    })}
                  </span>
                }
              >
                <StackedBars
                  rows={shares}
                  colorOf={colorOf}
                  normalize
                  ariaLabel="Each bro's share"
                />
              </Section>
            )}

            {methods.length > 0 && (
              <Section label="Methods">
                <StackedBars rows={methods} colorOf={colorOf} ariaLabel="Brews by method and bro" />
              </Section>
            )}
          </>
        )}

        {tab === "insights" &&
          stats.bros.map((numbers) => {
            const bro = byId.get(numbers.bro_id);
            if (!bro) return null;
            const rank = brewers.indexOf(numbers);
            return (
              <BroCard
                key={bro.id}
                bro={bro}
                color={colorOf.get(bro.id) ?? LEATHER}
                self={bro.id === meId}
                rank={rank >= 0 ? rank : null}
                numbers={numbers}
                insights={insights.get(bro.id)}
              />
            );
          })}
      </FadeIn>
    </FadeIn>
  );
}

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  masthead: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  title: {
    display: "flex",
    alignItems: "baseline",
    gap: space.sm,
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 44,
    lineHeight: 1.05,
  },
  year: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.muted,
  },
  caption: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: colors.muted,
  },
  legend: {
    display: "flex",
    gap: 4,
  },
});
