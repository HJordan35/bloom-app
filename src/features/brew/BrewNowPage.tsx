import * as stylex from "@stylexjs/stylex";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { parseISO } from "date-fns";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { brewMutations, brewQueries } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { FadeIn } from "../../components/FadeIn";
import { HeaderAction } from "../../components/HeaderAction";
import { DialIcon, PlusIcon } from "../../components/icons";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { dayHeading, greeting } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import type { CoachActions } from "../coach/CoachSheet";
import { recipeForBrew } from "../coach/recipe";
import { ActiveBrewCard, type BrewCardHandle } from "./ActiveBrewCard";
import { BrewCalendar, type CalendarView } from "./BrewCalendar";
import { BrewLauncher } from "./BrewLauncher";
import { BrewResultsSheet } from "./BrewResultsSheet";
import { BrewRow, LiveBrewRow } from "./BrewRows";
import { brewsByDay, dayKey, monthKey } from "./calendar";
import { newBrew } from "./draft";
import { FinishBrewSheet } from "./FinishBrewSheet";

// The coach brings the chat library with it, so it loads when first opened
const CoachSheet = lazy(() =>
  import("../coach/CoachSheet").then((module) => ({ default: module.CoachSheet })),
);

const COACH_TRIED = "bloom.coach.tried";

export function BrewNowPage() {
  const bro = useCurrentBro();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  // `?roast=<id>` or `?start` (from the Library), `?recipe=<brew id>` (from a brew), or
  // `?preferred=<id>` (from a preferred recipe) starts a brew
  const roastParam = params.get("roast");
  const recipeParam = params.get("recipe");
  const preferredParam = params.get("preferred");
  // `?coach` (from a roast page, with its `?roast`) opens the coach instead
  const [sheet, setSheet] = useState<"start" | "finish" | "coach" | null>(
    params.has("coach")
      ? "coach"
      : roastParam || recipeParam || preferredParam || params.has("start")
        ? "start"
        : null,
  );

  const mine = useQuery(brewQueries.myOpen(bro.id));
  const live = useQuery(brewQueries.live(bro.id));
  const recent = useQuery(brewQueries.recent(bro.id));
  const discardBrew = useMutation(brewMutations.discard());
  const startBrew = useMutation(brewMutations.start());

  // The coach: what it opens with (a roast from the launcher or a roast page, a line said for
  // you after a brew), and the brewing card it acts on
  const [coach, setCoach] = useState<{ roastId: string | null; opening?: string }>({
    roastId: params.has("coach") ? roastParam : null,
  });
  const card = useRef<BrewCardHandle>(null);
  // A brew just finished short of dialed in: offers the coach, until taken up or you leave
  const [unsettled, setUnsettled] = useState<BrewWithRoast | null>(null);

  // New here: its way in catches the light until it's been opened once on this device
  const [coachTried, setCoachTried] = useState(() => !!localStorage.getItem(COACH_TRIED));

  function openCoach(next: typeof coach = { roastId: null }) {
    localStorage.setItem(COACH_TRIED, "1");
    setCoachTried(true);
    setCoach(next);
    setSheet("coach");
  }

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

  // What the coach's cards do: change the open brew, or start one
  const coachActions: CoachActions = mine.data
    ? {
        label: "Apply",
        done: "Applied",
        onRecipe: (suggested) => card.current?.applyCoach(suggested),
      }
    : {
        label: "Brew this",
        done: "Started",
        onRecipe: ({ recipe }) => brewFrom(recipeForBrew(recipe)),
      };

  async function brewFrom(
    from: Parameters<typeof newBrew>[3] & { roast_id: string; method: string },
  ) {
    await startBrew.mutateAsync(newBrew(bro.id, from.roast_id, from.method, from));
    setUnsettled(null);
    closeSheet();
  }

  // The calendar: which month, which view, and the picked day whose brews are listed
  const [month, setMonth] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("quality");
  // Today starts picked. Tapping the picked day again, or changing month, leaves none picked:
  // the list asks for a day, and Browse is the way to every brew
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
      <HeaderAction icon={<DialIcon />} onClick={() => openCoach()}>
        <span {...stylex.props(!coachTried && styles.sheen)}>Dial in</span>
      </HeaderAction>
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
            ref={card}
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
            {unsettled && (
              <div {...stylex.props(styles.top)}>
                <p {...stylex.props(styles.greeting)}>Not quite there?</p>
                <HeaderAction
                  onClick={() => {
                    openCoach({
                      roastId: unsettled.roast_id,
                      opening: "Help me improve my last brew",
                    });
                    setUnsettled(null);
                  }}
                >
                  Dial in
                </HeaderAction>
              </div>
            )}
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
              label={selected ? dayHeading(parseISO(selected).toISOString()) : "Brews"}
              action={browse}
            >
              {null}
            </Section>
          </div>
          <div {...stylex.props(styles.rows)}>
            {selected && day.data?.length === 0 ? (
              // An empty day: starting a brew is the thing to do
              <div {...stylex.props(styles.startFirst)}>
                <EmptyState title="No brews that day." />
                <Button onClick={() => setSheet("start")}>Brew now</Button>
              </div>
            ) : (
              <>
                {/* The list's first row: the new brew will land right under it */}
                <button
                  type="button"
                  onClick={() => setSheet("start")}
                  {...stylex.props(styles.startRow)}
                >
                  <PlusIcon />
                  Brew now
                </button>
                {selected ? (
                  day.data && rows(day.data)
                ) : (
                  <EmptyState title="Select a day to see its brews." />
                )}
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
          onAskCoach={(roastId) => openCoach({ roastId })}
          onClose={closeSheet}
          onStarted={closeSheet}
        />
      )}
      {sheet === "coach" && (
        <Suspense>
          <CoachSheet
            roastId={coach.roastId}
            opening={coach.opening}
            brewing={!!mine.data}
            actions={coachActions}
            beforeSend={async () => card.current?.save()}
            onClose={closeSheet}
          />
        </Suspense>
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
          onSaved={(dialedIn) => {
            if (!dialedIn) setUnsettled(followUp);
            setFollowUp(null);
          }}
        />
      )}
    </FadeIn>
  );
}

// A glint crosses the word, then it rests: most of each cycle is still
const glint = stylex.keyframes({
  "0%": { backgroundPosition: "100% 0" },
  "30%": { backgroundPosition: "0% 0" },
  "100%": { backgroundPosition: "0% 0" },
});

const styles = stylex.create({
  sheen: {
    color: "transparent",
    backgroundImage: `linear-gradient(100deg, ${colors.brass} 0%, ${colors.brass} 42%, ${colors.text} 50%, ${colors.brass} 58%, ${colors.brass} 100%)`,
    backgroundSize: "300% 100%",
    backgroundPosition: "0% 0",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    animationName: { default: glint, "@media (prefers-reduced-motion: reduce)": "none" },
    animationDuration: "4.5s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
  },
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  // One slim line: the greeting on the left, the coach on the right
  top: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  // A row like the brews under it, in the quiet brass of a header action
  startRow: {
    width: "100%",
    minHeight: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
    cursor: "pointer",
  },
  startFirst: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingBottom: space.xl,
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
