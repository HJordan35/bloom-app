import * as stylex from "@stylexjs/stylex";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { brewQueries } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { broQueries } from "../../api/bros/bros.queries";
import { preferredQueries } from "../../api/preferred/preferred.queries";
import type { PreferredRecipeWithRoast } from "../../api/preferred/preferred.types";
import { roastQueries } from "../../api/roasts/roasts.queries";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { HeaderAction } from "../../components/HeaderAction";
import { PlusIcon } from "../../components/icons";
import { Section } from "../../components/Section";
import { TextToggle } from "../../components/TextToggle";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import { colors, space } from "../../theme/tokens.stylex";
import { BrewRow } from "../brew/BrewRows";
import { RoastPickerSheet } from "../brew/RoastChoice";
import { PreferredRow } from "../recipes/PreferredRow";
import type { BrowseFilter, BrowseKind } from "./browse";
import { FilterSheet } from "./FilterSheet";

const KINDS: { value: BrowseKind; label: string }[] = [
  { value: "recipes", label: "Recipes" },
  { value: "brews", label: "Brews" },
];

type Props = {
  filter: BrowseFilter;
  onFilterChange: (patch: Partial<BrowseFilter>) => void;
  /** "+ New" in the top row, when given. */
  onNew?: () => void;
  /** What it sits on, so the pinned filters cover the rows scrolling under them. */
  surface?: "page" | "sheet";
  onOpenRecipe: (recipe: PreferredRecipeWithRoast) => void;
  onOpenBrew: (brew: BrewWithRoast) => void;
};

/**
 * Preferred recipes or finished brews, narrowed by bros, roast and methods. Shared by the
 * Recipes tab, Browse brews and Select recipe. Every filter runs in the query.
 */
export function BrowseList({
  filter,
  onFilterChange,
  onNew,
  surface = "page",
  onOpenRecipe,
  onOpenBrew,
}: Props) {
  const me = useCurrentBro();
  const [picking, setPicking] = useState<"bros" | "roasts" | "methods" | null>(null);
  const query = {
    broIds: filter.broIds,
    roastId: filter.roastId ?? undefined,
    methods: filter.methods,
  };
  const recipes = useQuery({
    ...preferredQueries.list(query),
    enabled: filter.kind === "recipes",
    // Keep the list up while a new filter loads, rather than blanking it
    placeholderData: keepPreviousData,
  });
  const brews = useInfiniteQuery({
    ...brewQueries.browse(query),
    enabled: filter.kind === "brews",
    placeholderData: keepPreviousData,
  });
  const { data: roast } = useQuery({
    ...roastQueries.detail(filter.roastId ?? ""),
    enabled: !!filter.roastId,
  });
  // Every bro, you first: the bro filter's options (not looked up from the results)
  const { data: bros = [] } = useQuery({
    ...broQueries.list(),
    select: (all) =>
      [...all].sort(
        (a, b) =>
          Number(b.id === me.id) - Number(a.id === me.id) ||
          a.first_name.localeCompare(b.first_name),
      ),
  });
  const broName = (id: string) =>
    id === me.id ? "You" : (bros.find((b) => b.id === id)?.first_name ?? "…");
  const filtered = filter.broIds.length > 0 || !!filter.roastId || filter.methods.length > 0;
  // Bro names on brew rows, unless they're all yours
  const onlyYou = filter.broIds.length === 1 && filter.broIds[0] === me.id;

  return (
    <>
      {/* Pinned to the top of whatever scrolls (the page or the sheet); the rows go under it */}
      <div {...stylex.props(styles.pinned, surface === "sheet" ? styles.onSheet : styles.onPage)}>
        <div {...stylex.props(styles.top)}>
          <TextToggle
            options={KINDS}
            value={filter.kind}
            onChange={(kind) => onFilterChange({ kind })}
          />
          {onNew && (
            <HeaderAction icon={<PlusIcon />} onClick={onNew}>
              New
            </HeaderAction>
          )}
        </div>

        <div {...stylex.props(styles.filters)}>
          <FilterLink
            label={summary(filter.broIds.map(broName), "All bros", "bros")}
            clearLabel="All bros"
            onOpen={() => setPicking("bros")}
            onClear={filter.broIds.length > 0 ? () => onFilterChange({ broIds: [] }) : undefined}
          />
          <FilterLink
            label={filter.roastId ? (roast?.name ?? "…") : "All roasts"}
            clearLabel="All roasts"
            onOpen={() => setPicking("roasts")}
            onClear={filter.roastId ? () => onFilterChange({ roastId: null }) : undefined}
          />
          <FilterLink
            label={summary(filter.methods, "All methods", "methods")}
            clearLabel="All methods"
            onOpen={() => setPicking("methods")}
            onClear={filter.methods.length > 0 ? () => onFilterChange({ methods: [] }) : undefined}
          />
        </div>
      </div>

      {filter.kind === "recipes"
        ? recipes.data && (
            <RecipeResults
              recipes={recipes.data}
              filtered={filtered}
              canAdd={!!onNew}
              onOpen={onOpenRecipe}
            />
          )
        : brews.data && (
            <BrewResults
              brews={brews.data.pages.flat()}
              filtered={filtered}
              showBro={!onlyYou}
              more={brews.hasNextPage}
              loadingMore={brews.isFetchingNextPage}
              onMore={() => brews.fetchNextPage()}
              onOpen={onOpenBrew}
            />
          )}

      {picking === "bros" && (
        <FilterSheet
          title="Bros"
          label="Bro"
          options={bros.map((b) => b.id)}
          format={broName}
          selected={filter.broIds}
          onChange={(broIds) => onFilterChange({ broIds })}
          onClose={() => setPicking(null)}
        />
      )}
      {picking === "methods" && (
        <FilterSheet
          title="Methods"
          label="Method"
          options={BREW_METHODS}
          selected={filter.methods}
          onChange={(methods) => onFilterChange({ methods })}
          onClose={() => setPicking(null)}
        />
      )}
      {picking === "roasts" && (
        <RoastPickerSheet
          onClose={() => setPicking(null)}
          onPick={(picked) => {
            onFilterChange({ roastId: picked.id });
            setPicking(null);
          }}
        />
      )}
    </>
  );
}

/** A filter's choice in a few words: "All bros", "You, Ben", "3 bros". */
function summary(names: string[], all: string, plural: string) {
  if (names.length === 0) return all;
  return names.length <= 2 ? names.join(", ") : `${names.length} ${plural}`;
}

/** Recipes grouped by roast, yours first within the database's newest-first order. */
function RecipeResults({
  recipes,
  filtered,
  canAdd,
  onOpen,
}: {
  recipes: PreferredRecipeWithRoast[];
  filtered: boolean;
  canAdd: boolean;
  onOpen: (recipe: PreferredRecipeWithRoast) => void;
}) {
  const me = useCurrentBro();
  if (recipes.length === 0) {
    return filtered ? (
      <EmptyState title="No recipes found.">Try other filters.</EmptyState>
    ) : (
      <EmptyState title="No preferred recipes yet.">
        Bookmark one from any brew{canAdd ? ", or tap New" : ""}.
      </EmptyState>
    );
  }

  // The sort is stable, so each bro's recipes stay newest first
  const sorted = [...recipes].sort(
    (a, b) => Number(b.bro_id === me.id) - Number(a.bro_id === me.id),
  );
  const byRoast = new Map<string, PreferredRecipeWithRoast[]>();
  for (const r of sorted) byRoast.set(r.roast_id, [...(byRoast.get(r.roast_id) ?? []), r]);

  return [...byRoast.values()].map((group) => (
    <Section key={group[0].roast_id} label={group[0].roast.name}>
      <div>
        {group.map((r) => (
          <PreferredRow key={r.id} recipe={r} you={r.bro_id === me.id} onClick={() => onOpen(r)} />
        ))}
      </div>
    </Section>
  ));
}

/** Brews newest first, a page at a time. */
function BrewResults({
  brews,
  filtered,
  showBro,
  more,
  loadingMore,
  onMore,
  onOpen,
}: {
  brews: BrewWithRoast[];
  filtered: boolean;
  showBro: boolean;
  more: boolean;
  loadingMore: boolean;
  onMore: () => void;
  onOpen: (brew: BrewWithRoast) => void;
}) {
  if (brews.length === 0) {
    return filtered ? (
      <EmptyState title="No brews found.">Try other filters.</EmptyState>
    ) : (
      <EmptyState title="No brews yet.">Finished brews will gather here.</EmptyState>
    );
  }

  return (
    <div>
      {brews.map((brew) => (
        <BrewRow key={brew.id} brew={brew} showBro={showBro} onClick={() => onOpen(brew)} />
      ))}
      {more && (
        <Button variant="text" onClick={onMore} disabled={loadingMore}>
          {loadingMore ? "Loading…" : "Show more"}
        </Button>
      )}
    </div>
  );
}

/** A quiet "All roasts ▾" filter: opens its picker, with an × once something is chosen. */
function FilterLink({
  label,
  clearLabel,
  onOpen,
  onClear,
}: {
  label: string;
  /** Read out for the ×: what clearing goes back to. */
  clearLabel: string;
  onOpen: () => void;
  onClear?: () => void;
}) {
  return (
    <div {...stylex.props(styles.filter)}>
      <button
        type="button"
        onClick={onOpen}
        {...stylex.props(styles.filterButton, !!onClear && styles.filterOn)}
      >
        {label} ▾
      </button>
      {onClear && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={onClear}
          {...stylex.props(styles.filterButton)}
        >
          ×
        </button>
      )}
    </div>
  );
}

const styles = stylex.create({
  pinned: {
    position: "sticky",
    // Above the rows, whose entrance animation gives them their own layers
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
    paddingBottom: space.md,
    marginBottom: `calc(-1 * ${space.sm})`,
    // A faint brass rule under the filters, so the rows read as below them
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "rgba(184, 147, 90, 0.28)", // colors.brass at 28%
  },
  // Sticky stops inside the scroller's padding, so it pins at minus that padding to sit flush
  // under the header. It also starts there, pulled up over that padding, so it never scrolls
  // before pinning; its own small top padding matches the bottom's, around the filters.
  // The padding is AppShell's content padding on a page, the sheet body's in a sheet.
  onPage: {
    top: `calc(-1 * ${space.lg})`,
    marginTop: `calc(-1 * ${space.lg})`,
    paddingTop: space.md,
    backgroundColor: colors.bg,
  },
  onSheet: {
    top: `calc(-1 * ${space.md})`,
    marginTop: `calc(-1 * ${space.md})`,
    paddingTop: space.md,
    backgroundColor: colors.surface,
  },
  top: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: space.lg,
  },
  filter: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: space.sm,
  },
  filterButton: {
    minHeight: 44,
    marginBlock: -10,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    fontSize: 13,
    color: colors.muted,
    cursor: "pointer",
  },
  filterOn: {
    color: colors.text,
  },
});
