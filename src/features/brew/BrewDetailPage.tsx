import * as stylex from "@stylexjs/stylex";
import { Link, useParams } from "react-router-dom";
import { Section } from "../../components/Section";
import { formatTemp, mmss, relativeDate } from "../../lib/format";
import { useData } from "../../lib/useData";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { fetchBrew } from "./api";

export function BrewDetailPage() {
  const { id = "" } = useParams();
  const { data: brew } = useData(() => fetchBrew(id), [id]);
  if (!brew) return null;

  const stats: [string, string | null][] = [
    ["Dose", brew.dose_g != null ? `${brew.dose_g} g` : null],
    ["Grind", brew.grind_size],
    ["Grinder", brew.grinder],
    ["Temp", formatTemp(brew)],
    ["Brew time", brew.brew_time_s != null ? mmss(brew.brew_time_s) : null],
    ["Volume", brew.volume_ml != null ? `${brew.volume_ml} ml` : null],
  ];

  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <p {...stylex.props(styles.eyebrow)}>
          {brew.bro.first_name} · {relativeDate(brew.started_at)}
          {!brew.finished_at && " · brewing"}
        </p>
        <Link to={`/library/roasts/${brew.roast.id}`} {...stylex.props(styles.roast)}>
          {brew.roast.name}
        </Link>
        <p {...stylex.props(styles.meta)}>
          <Link to={`/library/roasters/${brew.roast.roaster.id}`} {...stylex.props(styles.link)}>
            {brew.roast.roaster.name}
          </Link>{" "}
          · {brew.roast.roast_level}
          {brew.roast.region && ` · ${brew.roast.region}`}
        </p>
        <p {...stylex.props(styles.method)}>
          {brew.method}
          {brew.dialed_in && <span {...stylex.props(styles.dialed)}>✦ Dialed in</span>}
        </p>
      </header>

      <Section label="Recipe">
        <dl {...stylex.props(styles.stats)}>
          {stats.map(([label, value]) => (
            <div key={label} {...stylex.props(styles.stat)}>
              <dt {...stylex.props(styles.statLabel)}>{label}</dt>
              <dd {...stylex.props(styles.statValue)}>{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {brew.result && (
        <Section label="Notes">
          <p {...stylex.props(styles.notes)}>{brew.result}</p>
        </Section>
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
    flexDirection: "column",
    gap: space.xs,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  roast: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 30,
    lineHeight: 1.15,
  },
  meta: {
    fontSize: 13,
    color: colors.muted,
    textTransform: "capitalize",
  },
  link: {
    textDecoration: "underline",
    textDecorationColor: colors.hairline,
    textUnderlineOffset: 3,
  },
  method: {
    display: "flex",
    gap: space.md,
    marginTop: space.sm,
  },
  dialed: {
    color: colors.brass,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    rowGap: space.md,
    columnGap: space.md,
    paddingTop: space.sm,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 16,
  },
  notes: {
    whiteSpace: "pre-wrap",
  },
});
