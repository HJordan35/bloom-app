import * as stylex from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import type { Ranking } from "../../api/rankings/rankings.types";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { levelStyles } from "../../components/Mosaic";
import { Section } from "../../components/Section";
import { formatScore } from "../../lib/ranking";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { BrewRow } from "../brew/BrewRows";

export function RoastRow({ roast, ranking }: { roast: RoastWithRoaster; ranking?: Ranking }) {
  return (
    <Link to={`/library/roasts/${roast.id}`} {...stylex.props(styles.row)}>
      <span {...stylex.props(styles.level, levelStyles[roast.roast_level])} />
      <div {...stylex.props(styles.main)}>
        <span>{roast.name}</span>
        <span {...stylex.props(styles.meta)}>
          {[roast.roast_level, roast.region].filter(Boolean).join(" · ")}
        </span>
      </div>
      <div {...stylex.props(styles.side)}>
        <span {...stylex.props(styles.score)}>{formatScore(ranking)}</span>
        <span {...stylex.props(styles.meta)}>{ranking?.brew_count ?? 0} brews</span>
      </div>
    </Link>
  );
}

/** Splits brews into "Your brews" and "Bros' brews", latest 10 each. */
export function BrewLists({ brews, broId }: { brews: BrewWithRoast[]; broId: string }) {
  const lists: [string, BrewWithRoast[]][] = [
    ["Your brews", brews.filter((b) => b.bro_id === broId)],
    ["Bros' brews", brews.filter((b) => b.bro_id !== broId)],
  ];
  return lists.map(([label, items]) => (
    <Section key={label} label={label}>
      {items.slice(0, 10).map((brew) => (
        <BrewRow key={brew.id} brew={brew} showBro />
      ))}
      {items.length === 0 && <p {...stylex.props(styles.empty)}>None yet.</p>}
    </Section>
  ));
}

const styles = stylex.create({
  row: {
    minHeight: 60,
    display: "flex",
    alignItems: "center",
    gap: space.md,
    paddingBlock: space.sm,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  level: {
    flexShrink: 0,
    width: 2,
    height: 28,
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
  side: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  score: {
    fontFamily: fonts.mono,
    fontSize: 15,
    color: colors.brass,
  },
  empty: {
    fontSize: 13,
    color: colors.faint,
    paddingBlock: space.sm,
  },
});
