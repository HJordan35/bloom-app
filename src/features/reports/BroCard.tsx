import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Bro } from "../../api/bros/bros.types";
import type { Insight, MonthlyStats } from "../../api/reports/reports.types";
import { Avatar } from "../../components/Avatar";
import { volume } from "../../lib/format";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { Figure } from "./HeadlineMosaic";
import { InsightCard } from "./InsightCard";

const ORDINALS = ["Top brewer", "No. 2 brewer", "No. 3 brewer"];

/** A bro's report card: their numbers as a row of small tiles, then their insights to swipe through. */
export function BroCard({
  bro,
  color,
  self,
  rank,
  numbers,
  insights,
}: {
  bro: Bro;
  color: string;
  self: boolean;
  /** Their place by brews this month (0-based), or null if they didn't brew. */
  rank: number | null;
  numbers: MonthlyStats["bros"][number];
  insights?: Insight[];
}) {
  const sat = numbers.brews === 0;

  return (
    <section {...stylex.props(styles.card)}>
      <Link to={`/bros/${bro.id}`} {...stylex.props(styles.header)}>
        <Avatar bro={bro} ring={color} self={self} />
        <span {...stylex.props(styles.name)}>{bro.first_name}</span>
        <span {...stylex.props(styles.rank)}>
          {sat ? "Sat this one out" : rank != null && ORDINALS[rank]}
        </span>
      </Link>

      {!sat && (
        <dl {...stylex.props(styles.numbers)}>
          {(
            [
              ["Brews", numbers.brews],
              ["Volume", volume(numbers.volume_ml)],
              ["Dialed", numbers.dialed_in],
              ["Firsts", numbers.first_tries],
            ] as const
          ).map(([label, value]) => (
            <div key={label} {...stylex.props(styles.number)}>
              <dt {...stylex.props(styles.label)}>{label}</dt>
              <dd>
                <Figure value={value} size="sm" />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {insights?.length ? <Carousel insights={insights} /> : null}
    </section>
  );
}

/** One insight at a time with the next one peeking in; dots show where you are. */
function Carousel({ insights }: { insights: Insight[] }) {
  const [index, setIndex] = useState(0);

  return (
    <div>
      <div
        {...stylex.props(styles.track)}
        onScroll={(e) => {
          const el = e.currentTarget;
          const slide = el.firstElementChild?.clientWidth ?? el.clientWidth;
          setIndex(Math.round(el.scrollLeft / slide));
        }}
      >
        {insights.map((insight) => (
          <div key={insight.position} {...stylex.props(styles.slide)}>
            <InsightCard insight={insight} />
          </div>
        ))}
      </div>
      <div {...stylex.props(styles.dots)}>
        {insights.map((insight, i) => (
          <span key={insight.position} {...stylex.props(styles.dot, i === index && styles.dotOn)} />
        ))}
      </div>
    </div>
  );
}

const styles = stylex.create({
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.hairline,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
  },
  name: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 22,
  },
  rank: {
    marginLeft: "auto",
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  numbers: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 4,
  },
  number: {
    display: "flex",
    flexDirection: "column-reverse", // value above label, dt first in markup
    gap: 4,
    paddingBlock: space.sm,
    paddingInline: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: colors.muted,
  },
  track: {
    display: "flex",
    gap: space.sm,
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    scrollbarWidth: "none",
    overscrollBehaviorX: "contain",
  },
  slide: {
    flex: "0 0 88%",
    // The card fills the slide (every slide the same height), and long source links can't widen it
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    scrollSnapAlign: "start",
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    paddingTop: space.sm,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    backgroundColor: colors.faint,
    transition: "background-color 150ms",
  },
  dotOn: {
    backgroundColor: colors.brass,
  },
});
