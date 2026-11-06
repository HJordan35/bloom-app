import * as stylex from "@stylexjs/stylex";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { brewMutations, brewQueries } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { EmptyState } from "../../components/EmptyState";
import { FadeIn } from "../../components/FadeIn";
import { HeaderAction } from "../../components/HeaderAction";
import { PlusIcon } from "../../components/icons";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { dayHeading, greeting } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { ActiveBrewCard } from "./ActiveBrewCard";
import { BrewCalendar, type CalendarView } from "./BrewCalendar";
import { BrewLauncher } from "./BrewLauncher";
import { BrewResultsSheet } from "./BrewResultsSheet";
import { BrewRow, LiveBrewRow } from "./BrewRows";
import { brewsByDay, dayKey, monthKey } from "./calendar";
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

  // The calendar: which month, which view, and a picked day narrowing the list to it
  const [month, setMonth] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("quality");
  // Today starts picked, so picking another day is plain to see; clearing shows Recent brews
  const [selected, setSelected] = useState<string | null>(() => dayKey(new Date()));
  const days = useQuery({
    ...brewQueries.month(bro.id, monthKey(month)),
    select: brewsByDay,
    // Keep the last month's diamonds up while the next one loads
    placeholderData: keepPreviousData,
  });
  const day = useQuery({
    ...brewQueries.day(bro.id, selected ?? ""),
    enabled: !!selected,
    placeholderData: keepPreviousData,
  });

  // Wait for them all so the page fades in as one piece
  if (mine.data === undefined || !live.data || !recent.data || !days.data) return null;

  const top = (
    <div {...stylex.props(styles.top)}>
      <p {...stylex.props(styles.greeting)}>
        {greeting()}, {bro.first_name}.
      </p>
      {mine.data === null && (
        <HeaderAction icon={<PlusIcon />} onClick={() => setSheet("start")}>
          Start a brew
        </HeaderAction>
      )}
    </div>
  );
  const brewingNow = live.data.length > 0 && (
    <Section label="Brewing now">
      {live.data.map((brew) => (
        <LiveBrewRow key={brew.id} brew={brew} />
      ))}
    </Section>
  );
  const browse = <HeaderAction onClick={() => navigate("/brews")}>Browse</HeaderAction>;
  const rows = (brews: BrewWithRoast[]) =>
    brews.map((brew) => <BrewRow key={brew.id} brew={brew} notes />);
  const noBrews = (
    <EmptyState title="No brews yet.">Your finished brews will gather here.</EmptyState>
  );

  return (
    <FadeIn xstyle={styles.page}>
      {mine.data ? (
        // Brewing: the card takes the calendar's place
        <>
          {top}
          <ActiveBrewCard
            key={mine.data.id}
            brew={mine.data}
            onFinish={() => setSheet("finish")}
            onDiscard={discard}
          />
          {brewingNow}
          <Section label="Recent brews" action={browse}>
            {rows(recent.data)}
            {recent.data.length === 0 && noBrews}
          </Section>
        </>
      ) : (
        <>
          {/* Everything above the rows stays put; only the rows scroll */}
          <div {...stylex.props(styles.pinned)}>
            {top}
            {brewingNow}
            <BrewCalendar
              month={month}
              days={days.data}
              view={view}
              onViewChange={setView}
              selected={selected}
              onSelect={setSelected}
              onMonthChange={(next) => {
                setMonth(next);
                setSelected(null);
              }}
            />
            <Section
              label={selected ? dayHeading(parseISO(selected).toISOString()) : "Recent brews"}
              action={
                selected ? (
                  <HeaderAction onClick={() => setSelected(null)}>× Clear</HeaderAction>
                ) : (
                  browse
                )
              }
            >
              {null}
            </Section>
          </div>
          <div {...stylex.props(styles.rows)}>
            {selected ? (
              day.data &&
              (day.data.length > 0 ? rows(day.data) : <EmptyState title="No brews that day." />)
            ) : (
              <>
                {rows(recent.data)}
                {recent.data.length === 0 && noBrews}
              </>
            )}
          </div>
        </>
      )}

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
  // One slim line: the greeting on the left, the page's way to start a brew on the right
  top: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  greeting: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontFamily: fonts.display,
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 1,
    color: colors.muted,
  },
  // BrowseList's pinned treatment: it's first in the scroller, so it's pulled up over the
  // content padding and pins at minus that padding, flush under the top bar
  pinned: {
    position: "sticky",
    zIndex: 1,
    top: `calc(-1 * ${space.lg})`,
    marginTop: `calc(-1 * ${space.lg})`,
    paddingTop: space.lg,
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
    backgroundColor: colors.bg,
  },
  // Rows sit as close under the pinned list header as they would inside its Section
  rows: {
    marginTop: `calc(${space.sm} - ${space.lg})`,
  },
});
