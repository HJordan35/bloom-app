import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { brewQueries } from "../../api/brews/brews.queries";
import { endorsementQueries } from "../../api/endorsements/endorsements.queries";
import { byRoasterId, byRoastId, rankingQueries } from "../../api/rankings/rankings.queries";
import { roasterQueries } from "../../api/roasters/roasters.queries";
import { roastQueries } from "../../api/roasts/roasts.queries";
import { Button } from "../../components/Button";
import { DetailHeader } from "../../components/DetailHeader";
import { Score } from "../../components/Score";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { byRank, rankPositions } from "../../lib/ranking";
import { space } from "../../theme/tokens.stylex";
import { EndorsementRow } from "../endorsements/EndorsementRow";
import { AddRoastForm } from "./AddRoastForm";
import { BrewedBy } from "./BrewedBy";
import { BrewLists, RoastRow } from "./LibraryRows";

export function RoasterPage() {
  const { id = "" } = useParams();
  const bro = useCurrentBro();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const { data: roaster } = useQuery(roasterQueries.detail(id));
  const { data: roasters } = useQuery(roasterQueries.list());
  const { data: allRoasts } = useQuery(roastQueries.list());
  const { data: roasterScores } = useQuery({ ...rankingQueries.roasters(), select: byRoasterId });
  const { data: roastScores } = useQuery({ ...rankingQueries.roasts(), select: byRoastId });
  const { data: brews } = useQuery(brewQueries.forRoaster(id));
  const { data: endorsements } = useQuery(endorsementQueries.list({ roasterId: id }));
  if (!roaster || !roasters || !allRoasts || !roasterScores || !roastScores) return null;
  if (!brews || !endorsements) return null;

  const roasts = allRoasts.filter((r) => r.roaster_id === id).sort(byRank(roastScores));
  const ranking = roasterScores.get(id);
  const positions = rankPositions(roasters, roasterScores);
  const position = positions.get(id);
  const rank = position ? { position, total: positions.size } : undefined;
  const myRoastIds = new Set(brews.filter((b) => b.bro_id === bro.id).map((b) => b.roast_id));
  const roastLists = [
    ["Your roasts", roasts.filter((r) => myRoastIds.has(r.id))],
    ["Bros' roasts", roasts.filter((r) => !myRoastIds.has(r.id))],
  ] as const;

  return (
    <div {...stylex.props(styles.page)}>
      <DetailHeader eyebrow="Roaster" title={roaster.name} meta={roaster.location}>
        <Score ranking={ranking} rank={rank} />
        <BrewedBy ranking={ranking} max={5} labelled />
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
