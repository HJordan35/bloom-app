import { areaY, barY, defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scalePoint } from "@tanstack/charts/scales/point";
import { useMemo } from "react";
import { BRASS, LEATHER } from "./broColors";

export type SparkPoint = { month: string; value: number };

/**
 * A tiny axis-free trend over the last few months, the latest last.
 * `area`: a brass line over a soft fill. `bars`: earlier months in leather, the latest in brass.
 */
export function Sparkline({
  points,
  variant,
  height,
  ariaLabel,
}: {
  points: SparkPoint[];
  variant: "area" | "bars";
  height: number;
  ariaLabel: string;
}) {
  const definition = useMemo(() => {
    const latest = points.at(-1)?.month;
    // The area's floor sits a little under the lowest month, so the trend's shape reads; bars keep zero
    const values = points.map((p) => p.value);
    const floor = Math.min(...values) * 0.6;
    const top = Math.max(1, ...values);
    const marks =
      variant === "area"
        ? [
            areaY(points, { x: "month", y1: floor, y2: "value", fill: BRASS, fillOpacity: 0.16 }),
            lineY(points, { x: "month", y: "value", stroke: BRASS, strokeWidth: 1.5 }),
          ]
        : [
            barY(points, {
              x: "month",
              y: "value",
              fill: (p) => (p.month === latest ? BRASS : LEATHER),
              radius: 1,
            }),
          ];
    return defineChart({
      marks,
      scales: {
        x: {
          scale:
            variant === "area"
              ? () => scalePoint<string>()
              : () => scaleBand<string>().padding(0.3),
        },
        y: { scale: variant === "area" ? scaleLinear().domain([floor, top]) : scaleLinear },
      },
      guides: false,
      // Room for the line's stroke at the top
      margin: { top: 2, right: 1, bottom: 0, left: 1 },
      pointer: false,
      keyboard: false,
      svgAnimation: true,
    });
  }, [points, variant]);

  return <Chart definition={definition} height={height} initialWidth={140} ariaLabel={ariaLabel} />;
}
