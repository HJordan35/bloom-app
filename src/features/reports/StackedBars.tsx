import * as stylex from "@stylexjs/stylex";
import { barX, defineChart } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { useMemo } from "react";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { LEATHER } from "./broColors";

export type StackedRow = {
  label: string;
  total: string | number;
  parts: { broId: string; value: number }[];
};

const ROW = 26; // keep in step with styles.label height

/**
 * One horizontal bar per row, split into each bro's share in their colour. The labels and totals
 * are HTML either side of the chart, on the same row height, so they stay crisp and on-theme.
 * `normalize` makes every bar full width (shares); otherwise bars share one scale (counts).
 */
export function StackedBars({
  rows,
  colorOf,
  normalize = false,
  ariaLabel,
}: {
  rows: StackedRow[];
  colorOf: Map<string, string>;
  normalize?: boolean;
  ariaLabel: string;
}) {
  const definition = useMemo(() => {
    const max = Math.max(1, ...rows.map((r) => r.parts.reduce((sum, p) => sum + p.value, 0)));
    const segments = rows.flatMap((row) => {
      const sum = row.parts.reduce((s, p) => s + p.value, 0);
      let start = 0;
      return row.parts
        .filter((p) => p.value > 0)
        .map((p) => {
          const share = p.value / (normalize ? sum : max);
          const segment = {
            id: `${row.label}-${p.broId}`,
            row: row.label,
            start,
            end: start + share,
          };
          start += share;
          return { ...segment, fill: colorOf.get(p.broId) ?? LEATHER };
        });
    });
    return defineChart({
      marks: [
        barX(segments, {
          y: "row",
          x1: "start",
          x2: "end",
          fill: (s) => s.fill,
          inset: 0.5,
        }),
      ],
      scales: {
        x: { scale: scaleLinear().domain([0, 1]) },
        // Inner + outer padding sum to one band, so each row is exactly ROW px and lines up with the labels
        y: {
          scale: scaleBand<string>()
            .domain(rows.map((r) => r.label))
            .paddingInner(0.45)
            .paddingOuter(0.225),
        },
      },
      guides: false,
      margin: 0,
      pointer: false,
      keyboard: false,
      svgAnimation: true,
    });
  }, [rows, colorOf, normalize]);

  return (
    <div {...stylex.props(styles.grid)}>
      <div {...stylex.props(styles.labels)}>
        {rows.map((r) => (
          <span key={r.label} {...stylex.props(styles.label)}>
            {r.label}
          </span>
        ))}
      </div>
      <Chart
        definition={definition}
        height={rows.length * ROW}
        initialWidth={200}
        ariaLabel={ariaLabel}
      />
      <div {...stylex.props(styles.labels)}>
        {rows.map((r) => (
          <span key={r.label} {...stylex.props(styles.label, styles.total)}>
            {r.total}
          </span>
        ))}
      </div>
    </div>
  );
}

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "72px minmax(0, 1fr) auto",
    columnGap: space.sm,
    alignItems: "start",
  },
  labels: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    height: 26,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    whiteSpace: "nowrap",
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: colors.muted,
  },
  total: {
    justifyContent: "flex-end",
    fontSize: 11,
    letterSpacing: 0,
    textTransform: "none",
    color: colors.text,
  },
});
