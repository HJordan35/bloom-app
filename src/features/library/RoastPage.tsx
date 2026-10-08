import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { brewQueries } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { endorsementQueries } from "../../api/endorsements/endorsements.queries";
import { byRoastId, rankingQueries } from "../../api/rankings/rankings.queries";
import { roastMutations, roastQueries } from "../../api/roasts/roasts.queries";
import { Button } from "../../components/Button";
import { DetailHeader } from "../../components/DetailHeader";
import { PhotoPicker } from "../../components/PhotoPicker";
import { Score } from "../../components/Score";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { mmss, recipeLine } from "../../lib/format";
import { rankPositions } from "../../lib/ranking";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { EndorsementRow } from "../endorsements/EndorsementRow";
import { EndorsementSheet } from "../endorsements/EndorsementSheet";
import { BrewedBy } from "./BrewedBy";
import { BrewLists } from "./LibraryRows";
import { RoastPhoto } from "./RoastPhoto";

/** Brews per method, with a dialed-in recipe if anyone has one. */
function summarizeByMethod(brews: BrewWithRoast[]) {
  const methods = new Set(brews.map((b) => b.method));
  return [...methods].map((method) => {
    const methodBrews = brews.filter((b) => b.method === method);
    return {
      method,
      brewCount: methodBrews.length,
      dialedIn: methodBrews.find((b) => b.dialed_in),
    };
  });
}

export function RoastPage() {
  const { id = "" } = useParams();
  const bro = useCurrentBro();
  const navigate = useNavigate();
  const [endorsing, setEndorsing] = useState(false);
  const { data: roast } = useQuery(roastQueries.detail(id));
  const { data: roasts } = useQuery(roastQueries.list());
  const { data: scores } = useQuery({ ...rankingQueries.roasts(), select: byRoastId });
  const { data: brews } = useQuery(brewQueries.forRoast(id));
  const { data: endorsements } = useQuery(endorsementQueries.list({ roastId: id }));
  const uploadPhoto = useMutation(roastMutations.uploadPhoto());
  if (!roast || !roasts || !scores || !brews || !endorsements) return null;

  const ranking = scores.get(id);
  const positions = rankPositions(roasts, scores);
  const position = positions.get(id);
  const rank = position ? { position, total: positions.size } : undefined;
  const uploading = uploadPhoto.isPending;
  const changePhoto = (file: File) => uploadPhoto.mutate({ roastId: roast.id, file });

  const hasPhoto = !!roast.photo_original_path;
  const methods = summarizeByMethod(brews).sort((a, b) => b.brewCount - a.brewCount);

  return (
    <div {...stylex.props(styles.page)}>
      {!hasPhoto && (
        <PhotoPicker label="Add bag photo" value={null} onChange={changePhoto} busy={uploading} />
      )}

      <DetailHeader
        eyebrow={<Link to={`/library/roasters/${roast.roaster.id}`}>{roast.roaster.name}</Link>}
        title={roast.name}
        meta={[roast.roast_level, roast.region].filter(Boolean).join(" · ")}
        media={hasPhoto && <RoastPhoto roast={roast} />}
        mediaAction={
          <PhotoPicker label="Replace" value={null} onChange={changePhoto} busy={uploading} chip />
        }
      >
        <Score ranking={ranking} rank={rank} />
        <BrewedBy ranking={ranking} max={5} labelled />
      </DetailHeader>

      <div {...stylex.props(styles.actions)}>
        <Button variant="ghost" onClick={() => setEndorsing(true)}>
          Endorse
        </Button>
        <Button onClick={() => navigate(`/?roast=${roast.id}`)}>Brew now</Button>
      </div>

      {methods.length > 0 && (
        <Section label="By method">
          {methods.map((m) => (
            <div key={m.method} {...stylex.props(styles.method)}>
              <div {...stylex.props(styles.methodHead)}>
                <span>{m.method}</span>
                <span {...stylex.props(styles.methodStats)}>
                  {m.brewCount} {m.brewCount === 1 ? "brew" : "brews"}
                </span>
              </div>
              {m.dialedIn && (
                <Link to={`/brews/${m.dialedIn.id}`} {...stylex.props(styles.recipe)}>
                  ✦ {m.dialedIn.bro.first_name}:{" "}
                  {[
                    recipeLine(m.dialedIn),
                    m.dialedIn.grinder,
                    m.dialedIn.brew_time_s != null && mmss(m.dialedIn.brew_time_s),
                  ]
                    .filter(Boolean)
                    .join(" · ") || "dialed in"}
                </Link>
              )}
            </div>
          ))}
        </Section>
      )}

      {endorsements.length > 0 && (
        <Section label="Endorsements">
          {endorsements.map((e) => (
            <EndorsementRow key={e.id} endorsement={e} />
          ))}
        </Section>
      )}

      <BrewLists brews={brews} broId={bro.id} />

      {endorsing && (
        <EndorsementSheet
          roast={roast}
          onClose={() => setEndorsing(false)}
          onSaved={() => setEndorsing(false)}
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
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: space.sm,
  },
  method: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
    paddingBlock: space.sm,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  methodHead: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space.md,
  },
  methodStats: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
  },
  recipe: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.brass,
  },
});
