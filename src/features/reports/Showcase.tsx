import * as stylex from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import type { Bro } from "../../api/bros/bros.types";
import { photoUrl } from "../../api/reports/reports.service";
import type { Insight, NewRoast } from "../../api/reports/reports.types";
import { AvatarStack } from "../../components/AvatarStack";
import { Section } from "../../components/Section";
import { volume } from "../../lib/format";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { Figure } from "./HeadlineMosaic";
import { InsightCard } from "./InsightCard";

/** The month's new coffees: their studio group shot, totals, and a row per coffee. */
export function Showcase({
  image,
  roasts,
  insights,
  bros,
  meId,
}: {
  /** The showcase image's URL, or null before one has been made. */
  image: string | null;
  roasts: NewRoast[];
  /** Each coffee's insight (B3), by roast id. */
  insights: Map<string, Insight>;
  bros: Map<string, Bro>;
  meId: string;
}) {
  const brews = roasts.reduce((sum, r) => sum + r.brews, 0);
  const ml = roasts.reduce((sum, r) => sum + Number(r.volume_ml), 0);

  return (
    <Section label="New this month">
      {image && (
        <img
          src={image}
          alt={`The month's new coffees: ${roasts.map((r) => r.name).join(", ")}`}
          loading="lazy"
          decoding="async"
          {...stylex.props(styles.image)}
        />
      )}

      <dl {...stylex.props(styles.figures)}>
        {(
          [
            ["New coffees", roasts.length],
            ["Brews", brews],
            ["Volume", volume(ml)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} {...stylex.props(styles.figure)}>
            <dt {...stylex.props(styles.caption)}>{label}</dt>
            <dd>
              <Figure value={value} size="sm" />
            </dd>
          </div>
        ))}
      </dl>

      {roasts.map((roast) => {
        const insight = insights.get(roast.roast_id);
        return (
          <div key={roast.roast_id}>
            <Link to={`/library/roasts/${roast.roast_id}`} {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.thumb)}>
                {roast.photo_path ? (
                  <img
                    src={photoUrl(roast.photo_path)}
                    alt=""
                    loading="lazy"
                    {...stylex.props(styles.thumbImage)}
                  />
                ) : (
                  roast.name.charAt(0)
                )}
              </span>
              <span {...stylex.props(styles.main)}>
                <span {...stylex.props(styles.name)}>{roast.name}</span>
                <span {...stylex.props(styles.caption)}>{roast.roaster}</span>
              </span>
              <AvatarStack
                bros={roast.bro_ids.flatMap((id) => bros.get(id) ?? [])}
                selfId={meId}
                on="page"
              />
              <span {...stylex.props(styles.side)}>
                <Figure value={roast.brews} size="sm" />
                <span {...stylex.props(styles.caption)}>{volume(Number(roast.volume_ml))}</span>
              </span>
            </Link>
            {/* Outside the link, since its sources are links of their own */}
            {insight && (
              <div {...stylex.props(styles.insight)}>
                <InsightCard insight={insight} compact />
              </div>
            )}
          </div>
        );
      })}
    </Section>
  );
}

const styles = stylex.create({
  image: {
    display: "block",
    width: "100%",
    aspectRatio: "4 / 5",
    objectFit: "cover",
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
  },
  figures: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 4,
  },
  figure: {
    display: "flex",
    flexDirection: "column-reverse", // value above label, dt first in markup
    gap: 4,
    paddingBlock: space.sm,
    paddingInline: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  caption: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: colors.muted,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    paddingBlock: space.xs,
  },
  // Lined up with the coffee's name: past the thumbnail and the row's gap
  insight: {
    paddingLeft: 44,
    paddingBottom: space.sm,
  },
  thumb: {
    flexShrink: 0,
    width: 36,
    aspectRatio: "4 / 5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.muted,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  name: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: fonts.display,
    fontSize: 16,
  },
  side: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
    minWidth: 44,
  },
});
