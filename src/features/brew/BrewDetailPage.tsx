import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { formatTemp, mmss, relativeDate } from "../../lib/format";
import { useData } from "../../lib/useData";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { fetchEndorsements } from "../endorsements/api";
import { EndorsementRow } from "../endorsements/EndorsementRow";
import { fetchBrew } from "./api";
import { EditBrewSheet } from "./EditBrewSheet";

export function BrewDetailPage() {
  const { id = "" } = useParams();
  const me = useCurrentBro();
  const [editing, setEditing] = useState(false);
  const { data, reload } = useData(
    () => Promise.all([fetchBrew(id), fetchEndorsements({ brewId: id })]),
    [id],
  );
  if (!data) return null;
  const [brew, endorsements] = data;
  const mine = brew.bro_id === me.id;

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

      {mine && (
        <Button variant="ghost" onClick={() => setEditing(true)}>
          Edit brew
        </Button>
      )}

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

      {brew.brew_notes && (
        <Section label="Brew notes">
          <p {...stylex.props(styles.notes)}>{brew.brew_notes}</p>
        </Section>
      )}

      {brew.brew_results && (
        <Section label="Results">
          <p {...stylex.props(styles.notes)}>{brew.brew_results}</p>
        </Section>
      )}

      {endorsements.length > 0 && (
        <Section label="Endorsement">
          {endorsements.map((e) => (
            <EndorsementRow key={e.id} endorsement={e} onChanged={reload} />
          ))}
        </Section>
      )}

      {editing && (
        <EditBrewSheet
          brew={brew}
          endorsement={endorsements[0]}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
        />
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
