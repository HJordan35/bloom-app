import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { DetailHeader } from "../../components/DetailHeader";
import { Score } from "../../components/Score";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { compareBy, rankPositions } from "../../lib/ranking";
import { useData } from "../../lib/useData";
import { space } from "../../theme/tokens.stylex";
import { AddRoastForm } from "./AddRoastForm";
import {
  fetchBrewsForRoaster,
  fetchEndorsements,
  fetchRoaster,
  fetchRoasterRankings,
  fetchRoasters,
  fetchRoastRankings,
  fetchRoasts,
} from "./api";
import { BrewLists, EndorsementRow, RoastRow } from "./LibraryRows";

async function load(id: string) {
  const [roaster, roasters, roasts, roasterRankings, roastRankings, brews, endorsements] =
    await Promise.all([
      fetchRoaster(id),
      fetchRoasters(),
      fetchRoasts(),
      fetchRoasterRankings(),
      fetchRoastRankings(),
      fetchBrewsForRoaster(id),
      fetchEndorsements({ roasterId: id }),
    ]);
  const roastScores = new Map(roastRankings.map((r) => [r.roast_id, r]));
  const positions = rankPositions(roasters, new Map(roasterRankings.map((r) => [r.roaster_id, r])));
  const position = positions.get(id);
  return {
    roaster,
    roasts: roasts.filter((r) => r.roaster_id === id).sort(compareBy("rank", roastScores)),
    ranking: roasterRankings.find((r) => r.roaster_id === id),
    rank: position ? { position, total: positions.size } : undefined,
    roastScores,
    brews,
    endorsements,
  };
}

export function RoasterPage() {
  const { id = "" } = useParams();
  const bro = useCurrentBro();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const { data } = useData(() => load(id), [id]);
  if (!data) return null;

  const { roaster, roasts, ranking, rank, roastScores, brews, endorsements } = data;
  const myRoastIds = new Set(brews.filter((b) => b.bro_id === bro.id).map((b) => b.roast_id));
  const roastLists = [
    ["Your roasts", roasts.filter((r) => myRoastIds.has(r.id))],
    ["Bros' roasts", roasts.filter((r) => !myRoastIds.has(r.id))],
  ] as const;

  return (
    <div {...stylex.props(styles.page)}>
      <DetailHeader eyebrow="Roaster" title={roaster.name} meta={roaster.location}>
        <Score ranking={ranking} rank={rank} />
      </DetailHeader>

      <Button onClick={() => navigate("/?start")}>Brew now</Button>

      {roastLists.map(([label, items]) =>
        items.length > 0 ? (
          <Section key={label} label={label}>
            {items.map((roast) => (
              <RoastRow key={roast.id} roast={roast} ranking={roastScores.get(roast.id)} />
            ))}
          </Section>
        ) : null,
      )}
      <Button variant="text" onClick={() => setAdding(true)}>
        + Add roast
      </Button>

      <BrewLists brews={brews} broId={bro.id} />

      {endorsements.length > 0 && (
        <Section label="Endorsements">
          {endorsements.map((e) => (
            <EndorsementRow key={e.id} endorsement={e} showRoast />
          ))}
        </Section>
      )}

      {adding && (
        <Sheet title="New roast" onClose={() => setAdding(false)}>
          <AddRoastForm
            initialRoasterId={roaster.id}
            onCreated={(roast) => navigate(`/library/roasts/${roast.id}`)}
            onCancel={() => setAdding(false)}
          />
        </Sheet>
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
});
