import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { brewMutations, brewQueries } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { FadeIn } from "../../components/FadeIn";
import { HeaderAction } from "../../components/HeaderAction";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { greeting } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { ActiveBrewCard } from "./ActiveBrewCard";
import { BrewLauncher } from "./BrewLauncher";
import { BrewResultsSheet } from "./BrewResultsSheet";
import { BrewRow, LiveBrewRow } from "./BrewRows";
import { FinishBrewSheet } from "./FinishBrewSheet";

export function BrewNowPage() {
  const bro = useCurrentBro();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  // `?roast=<id>` or `?start` (from the Library), `?recipe=<brew id>` (from a brew), or
  // `?preferred=<id>` (from a preferred recipe) starts a brew
  const roastParam = params.get("roast");
  const recipeParam = params.get("recipe");
  const preferredParam = params.get("preferred");
  const [sheet, setSheet] = useState<"start" | "finish" | null>(
    roastParam || recipeParam || preferredParam || params.has("start") ? "start" : null,
  );

  const mine = useQuery(brewQueries.myOpen(bro.id));
  const live = useQuery(brewQueries.live(bro.id));
  const recent = useQuery(brewQueries.recent(bro.id));
  const discardBrew = useMutation(brewMutations.discard());

  // The brew mutations refresh the cached brews themselves
  function closeSheet() {
    setSheet(null);
    if (params.size > 0) setParams({}, { replace: true });
  }

  // Already brewing: "Brew now" just lands on your open brew
  const brewing = !!mine.data;
  useEffect(() => {
    if (!brewing || sheet !== "start") return;
    setSheet(null);
    setParams({}, { replace: true });
  }, [brewing, sheet, setParams]);

  // After finishing, keep the brew around for the "How was it?" follow-up
  const [followUp, setFollowUp] = useState<BrewWithRoast | null>(null);

  function discard() {
    if (!mine.data || !confirm("Discard this brew?")) return;
    discardBrew.mutate(mine.data.id);
  }

  // Wait for all three so the page fades in as one piece
  if (mine.data === undefined || !live.data || !recent.data) return null;

  return (
    <FadeIn xstyle={styles.page}>
      <p {...stylex.props(styles.greeting)}>
        {greeting()}, {bro.first_name}.
      </p>

      {mine.data ? (
        <ActiveBrewCard
          key={mine.data.id}
          brew={mine.data}
          onFinish={() => setSheet("finish")}
          onDiscard={discard}
        />
      ) : (
        mine.data === null && <Button onClick={() => setSheet("start")}>Start a brew</Button>
      )}

      {live.data && live.data.length > 0 && (
        <Section label="Brewing now">
          {live.data.map((brew) => (
            <LiveBrewRow key={brew.id} brew={brew} />
          ))}
        </Section>
      )}

      <Section
        label="Recent brews"
        action={<HeaderAction onClick={() => navigate("/brews")}>Browse</HeaderAction>}
      >
        {recent.data?.map((brew) => (
          <BrewRow key={brew.id} brew={brew} notes />
        ))}
        {recent.data?.length === 0 && (
          <EmptyState title="No brews yet.">Your finished brews will gather here.</EmptyState>
        )}
      </Section>

      {sheet === "start" && mine.data === null && (
        <BrewLauncher
          initialRoastId={roastParam}
          initialRecipeId={recipeParam}
          initialPreferredId={preferredParam}
          onClose={closeSheet}
          onStarted={closeSheet}
        />
      )}
      {sheet === "finish" && mine.data && (
        <FinishBrewSheet
          brew={mine.data}
          onClose={closeSheet}
          onFinished={(brew) => {
            setFollowUp(brew);
            closeSheet();
          }}
        />
      )}
      {followUp && (
        <BrewResultsSheet
          brew={followUp}
          onClose={() => setFollowUp(null)}
          onSaved={() => setFollowUp(null)}
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
  greeting: {
    fontFamily: fonts.display,
    fontStyle: "italic",
    fontSize: 18,
    color: colors.muted,
  },
});
