import * as stylex from "@stylexjs/stylex";
import type { Insight, InsightType } from "../../api/reports/reports.types";
import { Card } from "../../components/Card";
import { colors, fonts, space } from "../../theme/tokens.stylex";

const LABELS: Record<InsightType, string> = {
  did_you_know: "Did you know",
  pattern: "Pattern",
  recommendation: "Recommendation",
  fact: "Fact",
  jab: "Jab",
};

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Card>
      <div {...stylex.props(styles.body)}>
        <span {...stylex.props(styles.type)}>{LABELS[insight.type]}</span>
        <p {...stylex.props(styles.content)}>{insight.content}</p>
        {insight.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            {...stylex.props(styles.source)}
          >
            ↗ {source.title}
          </a>
        ))}
      </div>
    </Card>
  );
}

const styles = stylex.create({
  body: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
  },
  type: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  content: {
    fontSize: 15,
    lineHeight: 1.5,
  },
  source: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 12,
    color: colors.muted,
  },
});
