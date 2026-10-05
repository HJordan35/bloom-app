import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { DetailHeader } from "../../components/DetailHeader";
import { PhotoPicker } from "../../components/PhotoPicker";
import { Score } from "../../components/Score";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { fetchBrosById } from "../../lib/bros";
import { mmss, recipeLine } from "../../lib/format";
import { rankPositions } from "../../lib/ranking";
import type { BrewWithRoast, EndorsementWithRoast } from "../../lib/types";
import { useData } from "../../lib/useData";
import { useLive } from "../../lib/useLive";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { fetchEndorsements } from "../endorsements/api";
import { EndorsementRow } from "../endorsements/EndorsementRow";
import { EndorsementSheet } from "../endorsements/EndorsementSheet";
import { fetchBrewsForRoast, fetchRoast, fetchRoastRankings, fetchRoasts } from "./api";
import { BrewedBy } from "./BrewedBy";
import { BrewLists } from "./LibraryRows";
import { uploadRoastPhoto } from "./photos";
import { RoastPhoto } from "./RoastPhoto";

async function load(id: string) {
  const [roast, roasts, rankings, brews, endorsements, brosById] = await Promise.all([
    fetchRoast(id),
    fetchRoasts(),
    fetchRoastRankings(),
    fetchBrewsForRoast(id),
    fetchEndorsements({ roastId: id }),
    fetchBrosById(),
  ]);
  const positions = rankPositions(roasts, new Map(rankings.map((r) => [r.roast_id, r])));
  const position = positions.get(id);
  return {
    roast,
    ranking: rankings.find((r) => r.roast_id === id),
    rank: position ? { position, total: positions.size } : undefined,
    brews,
    endorsements,
    brosById,
  };
}

type MethodSummary = {
  method: string;
  brewCount: number;
  avgRating: number | null;
  dialedIn: BrewWithRoast | undefined;
};

/** Roll brews and endorsements up per method. Ratings use each bro's latest, like the ranking. */
function summarizeByMethod(brews: BrewWithRoast[], endorsements: EndorsementWithRoast[]) {
  const methods = new Set([
    ...brews.map((b) => b.method),
    ...endorsements.flatMap((e) => (e.method && e.rating != null ? [e.method] : [])),
  ]);
  return [...methods].map((method): MethodSummary => {
    const methodBrews = brews.filter((b) => b.method === method);
    const latestByBro = new Map<string, number>();
    for (const e of endorsements) {
      if (e.method === method && e.rating != null && !latestByBro.has(e.bro_id)) {
        latestByBro.set(e.bro_id, e.rating);
      }
    }
    const ratings = [...latestByBro.values()];
    return {
      method,
      brewCount: methodBrews.length,
      avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      dialedIn: methodBrews.find((b) => b.dialed_in),
    };
  });
}

export function RoastPage() {
  const { id = "" } = useParams();
  const bro = useCurrentBro();
  const navigate = useNavigate();
  const [endorsing, setEndorsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { data, reload } = useData(() => load(id), [id]);
  useLive(["roasts"], reload); // the studio photo finishes developing in the background
  if (!data) return null;

  const { roast, ranking, rank, brews, endorsements, brosById } = data;
  async function changePhoto(file: File) {
    setUploading(true);
    await uploadRoastPhoto(roast.id, file);
    setUploading(false);
    reload();
  }

  const methods = summarizeByMethod(brews, endorsements).sort((a, b) => b.brewCount - a.brewCount);

  return (
    <div {...stylex.props(styles.page)}>
      {roast.photo_original_path && (
        <div {...stylex.props(styles.hero)}>
          <RoastPhoto roast={roast} />
        </div>
      )}
      {uploading ? (
        <p {...stylex.props(styles.uploading)}>Uploading…</p>
      ) : (
        <PhotoPicker
          label={roast.photo_original_path ? "Replace photo" : "Add bag photo"}
          value={null}
          onChange={changePhoto}
        />
      )}

      <DetailHeader
        eyebrow={<Link to={`/library/roasters/${roast.roaster.id}`}>{roast.roaster.name}</Link>}
        title={roast.name}
        meta={[roast.roast_level, roast.region].filter(Boolean).join(" · ")}
      >
        <Score ranking={ranking} rank={rank} />
        <BrewedBy ranking={ranking} brosById={brosById} max={5} labelled />
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
                  {m.avgRating != null && ` · rated ${m.avgRating.toFixed(1)}`}
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
            <EndorsementRow key={e.id} endorsement={e} onChanged={reload} />
          ))}
        </Section>
      )}

      <BrewLists brews={brews} broId={bro.id} />

      {endorsing && (
        <EndorsementSheet
          roast={roast}
          onClose={() => setEndorsing(false)}
          onSaved={() => {
            setEndorsing(false);
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
  hero: {
    width: "70%",
    alignSelf: "center",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  uploading: {
    minHeight: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
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
