import * as stylex from "@stylexjs/stylex";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { brewQueries } from "../../api/brews/brews.queries";
import type { Brew, BrewWithRoast } from "../../api/brews/brews.types";
import type { Bro } from "../../api/bros/bros.types";
import { preferredQueries } from "../../api/preferred/preferred.queries";
import type { PreferredRecipeWithRoast } from "../../api/preferred/preferred.types";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { EmptyState } from "../../components/EmptyState";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { TextToggle } from "../../components/TextToggle";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import { recipeLine, relativeDate } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { PreferredRow, PreferredSummary } from "../recipes/PreferredRow";
import { BrewRecipe } from "./BrewStats";

const ALL = "All";
type Tab = "preferred" | "history";
const TABS: { value: Tab; label: string }[] = [
  { value: "preferred", label: "Preferred" },
  { value: "history", label: "History" },
];

/** What a recipe is borrowed from: a past brew or a preferred recipe. */
export type RecipeSource = Partial<Brew> & Pick<Brew, "method">;

type Props = {
  roast: RoastWithRoaster;
  /** The new brew's method, if chosen: the method filter starts on it. */
  method: string | null;
  /** `preferredId` is set when the source is a preferred recipe. */
  onUse: (source: RecipeSource, preferredId: string | null) => void;
  onClose: () => void;
};

type Viewing =
  | { kind: "brew"; brew: BrewWithRoast }
  | { kind: "preferred"; recipe: PreferredRecipeWithRoast };

/**
 * A roast's preferred recipes and every bro's past brews of it, to borrow a recipe from.
 * Opens on Preferred when there are any for the method.
 */
export function RecipeHistorySheet({ roast, method, onUse, onClose }: Props) {
  const me = useCurrentBro();
  const [methodFilter, setMethodFilter] = useState(method ?? ALL);
  const methods = methodFilter === ALL ? [] : [methodFilter];
  const { data: preferred } = useQuery({
    ...preferredQueries.list({ roastId: roast.id, methods }),
    placeholderData: keepPreviousData,
  });
  const { data: brews } = useQuery(brewQueries.forRoast(roast.id));
  const [chosenTab, setTab] = useState<Tab | null>(null);
  // Track who's switched off, so every bro starts on
  const [hiddenBros, setHiddenBros] = useState<Set<string>>(() => new Set());
  const [viewing, setViewing] = useState<Viewing | null>(null);

  if (viewing) {
    return (
      <Sheet title="Recipe" tall onClose={onClose}>
        {viewing.kind === "brew" ? (
          <BrewSummary
            brew={viewing.brew}
            you={viewing.brew.bro_id === me.id}
            onUse={() => onUse(viewing.brew, null)}
          />
        ) : (
          <PreferredSummary
            recipe={viewing.recipe}
            you={viewing.recipe.bro_id === me.id}
            onUse={() => onUse(viewing.recipe, viewing.recipe.id)}
          />
        )}
        <Button variant="text" onClick={() => setViewing(null)}>
          ← All recipes
        </Button>
      </Sheet>
    );
  }

  // Opens on Preferred when the first load finds any; after that, only you switch tabs
  if (chosenTab === null && preferred) setTab(preferred.length ? "preferred" : "history");
  const tab = chosenTab ?? "history";
  const loaded = tab === "preferred" ? preferred : brews;
  const rows: { bro: Bro; bro_id: string }[] = loaded ?? [];
  const bros = [...new Map(rows.map((r) => [r.bro.id, r.bro])).values()].sort(
    (a, b) =>
      Number(b.id === me.id) - Number(a.id === me.id) || a.first_name.localeCompare(b.first_name),
  );
  const shownBrews = (brews ?? [])
    .filter((b) => methodFilter === ALL || b.method === methodFilter)
    .filter((b) => !hiddenBros.has(b.bro_id));
  const shownPreferred = (preferred ?? [])
    .filter((r) => !hiddenBros.has(r.bro_id))
    // Newest first from the database; yours lead, and the sort is stable
    .sort((a, b) => Number(b.bro_id === me.id) - Number(a.bro_id === me.id));
  const shown = tab === "preferred" ? shownPreferred : shownBrews;

  function toggleBro(id: string) {
    setHiddenBros((hidden) => {
      const next = new Set(hidden);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <Sheet title="Select recipe" tall onClose={onClose}>
      <TextToggle options={TABS} value={tab} onChange={setTab} />

      <Section label="Method">
        <Chips options={[ALL, ...BREW_METHODS]} value={methodFilter} onChange={setMethodFilter} />
      </Section>

      {bros.length > 1 && (
        <Section label="Bros">
          <div {...stylex.props(styles.bros)}>
            {bros.map((b) => {
              const on = !hiddenBros.has(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={b.id === me.id ? "You" : b.first_name}
                  title={b.id === me.id ? "You" : b.first_name}
                  onClick={() => toggleBro(b.id)}
                  {...stylex.props(styles.bro, !on && styles.broOff)}
                >
                  <Avatar bro={b} selected={on} />
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {loaded &&
        (shown.length === 0 ? (
          <EmptyState title="No recipes found.">
            {tab === "preferred"
              ? `No one has bookmarked a recipe for ${roast.name} with these filters.`
              : `No brews of ${roast.name} match these filters.`}
          </EmptyState>
        ) : tab === "preferred" ? (
          <div>
            {shownPreferred.map((r) => (
              <PreferredRow
                key={r.id}
                recipe={r}
                you={r.bro_id === me.id}
                onClick={() => setViewing({ kind: "preferred", recipe: r })}
              />
            ))}
          </div>
        ) : (
          <div>
            {shownBrews.map((brew) => (
              <HistoryRow
                key={brew.id}
                brew={brew}
                you={brew.bro_id === me.id}
                onClick={() => setViewing({ kind: "brew", brew })}
              />
            ))}
          </div>
        ))}
    </Sheet>
  );
}

function HistoryRow({
  brew,
  you,
  onClick,
}: {
  brew: BrewWithRoast;
  you: boolean;
  onClick: () => void;
}) {
  const recipe = recipeLine(brew);
  return (
    <button type="button" onClick={onClick} {...stylex.props(styles.row)}>
      <div {...stylex.props(styles.main)}>
        <span>
          {you ? "You" : brew.bro.first_name} · {brew.method}
        </span>
        {recipe && <span {...stylex.props(styles.meta)}>{recipe}</span>}
      </div>
      <span {...stylex.props(styles.side)}>{relativeDate(brew.started_at)}</span>
    </button>
  );
}

function BrewSummary({
  brew,
  you,
  onUse,
}: {
  brew: BrewWithRoast;
  you: boolean;
  onUse: () => void;
}) {
  return (
    <>
      <header {...stylex.props(styles.header)}>
        <p {...stylex.props(styles.eyebrow)}>
          {you ? "You" : brew.bro.first_name} · {relativeDate(brew.started_at)}
        </p>
        <p {...stylex.props(styles.method)}>
          {brew.method}
          {brew.dialed_in && <span {...stylex.props(styles.dialed)}>✦ Dialed in</span>}
        </p>
      </header>

      <BrewRecipe brew={brew} onUse={onUse} />

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
    </>
  );
}

const styles = stylex.create({
  bros: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.xs,
    // Line the first avatar up with the edge, not its tap target
    marginInline: -7,
  },
  bro: {
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    cursor: "pointer",
    transition: "opacity 150ms",
  },
  broOff: {
    opacity: 0.5,
  },
  row: {
    width: "100%",
    minHeight: 60,
    display: "flex",
    alignItems: "center",
    gap: space.md,
    paddingBlock: space.sm,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
    color: colors.text,
    textAlign: "left",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  side: {
    flexShrink: 0,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
  },
  dialed: {
    color: colors.brass,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  method: {
    display: "flex",
    gap: space.md,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  notes: {
    whiteSpace: "pre-wrap",
  },
});
