import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { greeting } from "../../lib/format";
import { supabase } from "../../lib/supabase";
import type { BrewWithRoast } from "../../lib/types";
import { useData } from "../../lib/useData";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { ActiveBrewCard } from "./ActiveBrewCard";
import { discardBrew, fetchLiveBrews, fetchMyOpenBrew, fetchRecentBrews } from "./api";
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

  const mine = useData(() => fetchMyOpenBrew(bro.id), [bro.id]);
  const live = useData(() => fetchLiveBrews(bro.id), [bro.id]);
  const recent = useData(() => fetchRecentBrews(bro.id), [bro.id]);
  const { reload: reloadMine } = mine;
  const { reload: reloadLive } = live;
  const { reload: reloadRecent } = recent;

  // Any brew change by any bro refreshes the page
  useEffect(() => {
    const channel = supabase
      .channel(`brews-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "brews" }, () => {
        reloadMine();
        reloadLive();
        reloadRecent();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reloadMine, reloadLive, reloadRecent]);

  function closeSheet() {
    setSheet(null);
    if (params.size > 0) setParams({}, { replace: true });
  }

  // After finishing, keep the brew around for the "How was it?" follow-up
  const [followUp, setFollowUp] = useState<BrewWithRoast | null>(null);

  function refresh() {
    closeSheet();
    reloadMine();
    reloadRecent();
  }

  async function discard() {
    if (!mine.data || !confirm("Discard this brew?")) return;
    await discardBrew(mine.data.id);
    reloadMine();
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
        <StartBrewSheet initialRoastId={roastParam} onClose={closeSheet} onStarted={refresh} />
      )}
      {sheet === "finish" && mine.data && (
        <FinishBrewSheet
          brew={mine.data}
          onClose={closeSheet}
          onFinished={() => {
            setFollowUp(mine.data ?? null);
            refresh();
          }}
        />
      )}
      {followUp && (
        <BrewResultsSheet
          brew={followUp}
          onClose={() => setFollowUp(null)}
          onSaved={() => {
            setFollowUp(null);
            reloadRecent();
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
  greeting: {
    fontFamily: fonts.display,
    fontStyle: "italic",
    fontSize: 18,
    color: colors.muted,
  },
});
