import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { brewMutations, brewQueries, invalidateBrews } from "../../api/brews/brews.queries";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { greeting } from "../../lib/format";
import type { BrewWithRoast } from "../../lib/types";
import { useLive } from "../../lib/useLive";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { ActiveBrewCard } from "./ActiveBrewCard";
import { BrewResultsSheet } from "./BrewResultsSheet";
import { BrewRow, LiveBrewRow } from "./BrewRows";
import { FinishBrewSheet } from "./FinishBrewSheet";
import { StartBrewSheet } from "./StartBrewSheet";

export function BrewNowPage() {
  const bro = useCurrentBro();
  const [params, setParams] = useSearchParams();
  // `?roast=<id>` or `?start` (from the Library) opens the start sheet
  const roastParam = params.get("roast");
  const [sheet, setSheet] = useState<"start" | "finish" | null>(
    roastParam || params.has("start") ? "start" : null,
  );

  const mine = useQuery(brewQueries.myOpen(bro.id));
  const live = useQuery(brewQueries.live(bro.id));
  const recent = useQuery(brewQueries.recent(bro.id));
  const discardBrew = useMutation(brewMutations.discard());

  // Any brew change by any bro refreshes the page
  useLive(["brews"], invalidateBrews);

  // The brew mutations refresh the cached brews themselves
  function closeSheet() {
    setSheet(null);
    if (params.size > 0) setParams({}, { replace: true });
  }

  // After finishing, keep the brew around for the "How was it?" follow-up
  const [followUp, setFollowUp] = useState<BrewWithRoast | null>(null);

  function discard() {
    if (!mine.data || !confirm("Discard this brew?")) return;
    discardBrew.mutate(mine.data.id);
  }

  return (
    <div {...stylex.props(styles.page)}>
      <p {...stylex.props(styles.greeting)}>
        {greeting()}, {bro.first_name}.
      </p>

      {mine.data ? (
        <ActiveBrewCard brew={mine.data} onFinish={() => setSheet("finish")} onDiscard={discard} />
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

      <Section label="Recent brews">
        {recent.data?.map((brew) => (
          <BrewRow key={brew.id} brew={brew} />
        ))}
        {recent.data?.length === 0 && (
          <EmptyState title="No brews yet.">Your finished brews will gather here.</EmptyState>
        )}
      </Section>

      {sheet === "start" && (
        <StartBrewSheet initialRoastId={roastParam} onClose={closeSheet} onStarted={closeSheet} />
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
    </div>
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
