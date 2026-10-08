import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { brewQueries } from "../../api/brews/brews.queries";
import { endorsementQueries } from "../../api/endorsements/endorsements.queries";
import { FadeIn } from "../../components/FadeIn";
import { HeaderAction } from "../../components/HeaderAction";
import { PencilIcon } from "../../components/icons";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { relativeDate } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { EndorsementRow } from "../endorsements/EndorsementRow";
import { BrewRecipe } from "./BrewStats";
import { EditBrewSheet } from "./EditBrewSheet";

export function BrewDetailPage() {
  const { id = "" } = useParams();
  const me = useCurrentBro();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const { data: brew } = useQuery(brewQueries.detail(id));
  const { data: endorsements } = useQuery(endorsementQueries.list({ brewId: id }));
  if (!brew || !endorsements) return null;
  const mine = brew.bro_id === me.id;

  return (
    <FadeIn xstyle={styles.page}>
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.top)}>
          <p {...stylex.props(styles.eyebrow)}>
            {brew.bro.first_name} · {relativeDate(brew.started_at)}
            {!brew.finished_at && " · brewing"}
          </p>
          {mine && (
            <HeaderAction icon={<PencilIcon />} onClick={() => setEditing(true)}>
              Edit
            </HeaderAction>
          )}
        </div>
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

      <BrewRecipe brew={brew} onUse={() => navigate(`/?recipe=${brew.id}`)} />

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
            <EndorsementRow key={e.id} endorsement={e} />
          ))}
        </Section>
      )}

      {editing && (
        <EditBrewSheet
          brew={brew}
          endorsement={endorsements[0]}
          onClose={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      )}
    </FadeIn>
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
  top: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
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
  notes: {
    whiteSpace: "pre-wrap",
  },
});
