import * as stylex from "@stylexjs/stylex";
import { colors, fonts, space } from "../theme/tokens.stylex";

/** Big mono numbers over small-caps labels, four to a row, between hairlines. */
export function StatStrip({ stats }: { stats: [label: string, value: string | number][] }) {
  return (
    <dl {...stylex.props(styles.stats)}>
      {stats.map(([label, value]) => (
        <div key={label} {...stylex.props(styles.stat)}>
          <dt {...stylex.props(styles.label)}>{label}</dt>
          <dd {...stylex.props(styles.value)}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const styles = stylex.create({
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    rowGap: space.md,
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
  value: {
    fontFamily: fonts.mono,
    fontSize: 22,
    whiteSpace: "nowrap",
  },
  label: {
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    textAlign: "center",
    color: colors.muted,
  },
});
