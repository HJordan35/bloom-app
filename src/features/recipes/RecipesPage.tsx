import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { preferredQueries } from "../../api/preferred/preferred.queries";
import type { PreferredRecipeWithRoast } from "../../api/preferred/preferred.types";
import { roastQueries } from "../../api/roasts/roasts.queries";
import { EmptyState } from "../../components/EmptyState";
import { FadeIn } from "../../components/FadeIn";
import { HeaderAction } from "../../components/HeaderAction";
import { PencilIcon, PlusIcon } from "../../components/icons";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { TextToggle } from "../../components/TextToggle";
import { useCurrentBro } from "../../lib/auth";
import { colors, space } from "../../theme/tokens.stylex";
import { RoastPickerSheet } from "../brew/RoastChoice";
import { MethodFilterSheet } from "./MethodFilterSheet";
import { PreferredRecipeSheet, type PreferredStart } from "./PreferredRecipeSheet";
import { PreferredRow, PreferredSummary } from "./PreferredRow";

type Who = "mine" | "all";
const WHO: { value: Who; label: string }[] = [
  { value: "mine", label: "Mine" },
  { value: "all", label: "All" },
];

/** What the page has open over it: a recipe, the form, or the roast filter's picker. */
type Open =
  | { kind: "view"; recipe: PreferredRecipeWithRoast }
  | { kind: "edit"; recipe: PreferredRecipeWithRoast }
  | { kind: "new"; from: PreferredStart }
  | { kind: "roasts" }
  | { kind: "methods" };

/** Every preferred recipe, yours or everyone's, by roast. Filters live in the URL. */
export function RecipesPage() {
  const me = useCurrentBro();
  const [params, setParams] = useSearchParams();
  const who: Who = params.get("who") === "all" ? "all" : "mine";
  const roastId = params.get("roast");
  const [open, setOpen] = useState<Open | null>(null);
  const { data: recipes } = useQuery(preferredQueries.list());
  const { data: roast } = useQuery({
    ...roastQueries.detail(roastId ?? ""),
    enabled: !!roastId,
  });

  function setParam(key: string, value: string | string[] | null) {
    setParams(
      (p) => {
        p.delete(key);
        for (const v of [value ?? []].flat()) p.append(key, v);
        return p;
      },
      { replace: true },
    );
  }

  if (!recipes) return null;

  const listed = recipes
    .filter((r) => who === "all" || r.bro_id === me.id)
    .filter((r) => !roastId || r.roast_id === roastId)
    // Newest first already; yours lead, and the sort is stable
    .sort((a, b) => Number(b.bro_id === me.id) - Number(a.bro_id === me.id));
  const methods = [...new Set(listed.map((r) => r.method))].map((method) => ({
    method,
    count: listed.filter((r) => r.method === method).length,
  }));
  // Ticked methods with nothing left to show (after Mine or a roast) fall away
  const picked = params.getAll("method").filter((m) => methods.some((x) => x.method === m));
  const shown = listed.filter((r) => picked.length === 0 || picked.includes(r.method));
  const byRoast = new Map<string, PreferredRecipeWithRoast[]>();
  for (const r of shown) byRoast.set(r.roast_id, [...(byRoast.get(r.roast_id) ?? []), r]);

  return (
    <FadeIn xstyle={styles.page}>
      <div {...stylex.props(styles.top)}>
        <TextToggle
          options={WHO}
          value={who}
          onChange={(w) => setParam("who", w === "all" ? w : null)}
        />
        <HeaderAction
          icon={<PlusIcon />}
          onClick={() => setOpen({ kind: "new", from: { roast: roast ?? undefined } })}
        >
          New
        </HeaderAction>
      </div>

      <div {...stylex.props(styles.filters)}>
        <FilterLink
          label={roastId ? (roast?.name ?? "…") : "All roasts"}
          clearLabel="All roasts"
          onOpen={() => setOpen({ kind: "roasts" })}
          onClear={roastId ? () => setParam("roast", null) : undefined}
        />
        <FilterLink
          label={
            picked.length === 0
              ? "All methods"
              : picked.length <= 2
                ? picked.join(", ")
                : `${picked.length} methods`
          }
          clearLabel="All methods"
          onOpen={() => setOpen({ kind: "methods" })}
          onClear={picked.length > 0 ? () => setParam("method", null) : undefined}
        />
      </div>

      {shown.length === 0 ? (
        <EmptyState title="No preferred recipes yet.">
          Save one from any brew's recipe, or tap New.
        </EmptyState>
      ) : (
        [...byRoast.values()].map((group) => (
          <Section key={group[0].roast_id} label={group[0].roast.name}>
            <div>
              {group.map((r) => (
                <PreferredRow
                  key={r.id}
                  recipe={r}
                  you={r.bro_id === me.id}
                  onClick={() => setOpen({ kind: "view", recipe: r })}
                />
              ))}
            </div>
          </Section>
        ))
      )}

      {open?.kind === "view" && (
        <Sheet title="Preferred recipe" tall onClose={() => setOpen(null)}>
          <PreferredSummary
            recipe={open.recipe}
            you={open.recipe.bro_id === me.id}
            action={
              open.recipe.bro_id === me.id ? (
                <HeaderAction
                  icon={<PencilIcon />}
                  onClick={() => setOpen({ kind: "edit", recipe: open.recipe })}
                >
                  Edit
                </HeaderAction>
              ) : (
                <HeaderAction
                  onClick={() =>
                    setOpen({
                      kind: "new",
                      from: {
                        roast: open.recipe.roast,
                        method: open.recipe.method,
                        values: open.recipe,
                      },
                    })
                  }
                >
                  Save as mine
                </HeaderAction>
              )
            }
          />
        </Sheet>
      )}
      {open?.kind === "edit" && (
        <PreferredRecipeSheet
          recipe={open.recipe}
          onClose={() => setOpen(null)}
          onSaved={() => setOpen(null)}
        />
      )}
      {open?.kind === "new" && (
        <PreferredRecipeSheet
          from={open.from}
          onClose={() => setOpen(null)}
          onSaved={() => setOpen(null)}
        />
      )}
      {open?.kind === "methods" && (
        <MethodFilterSheet
          methods={methods}
          selected={picked}
          onChange={(m) => setParam("method", m)}
          onClose={() => setOpen(null)}
        />
      )}
      {open?.kind === "roasts" && (
        <RoastPickerSheet
          onClose={() => setOpen(null)}
          onPick={(picked) => {
            setParam("roast", picked.id);
            setOpen(null);
          }}
        />
      )}
    </FadeIn>
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
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
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
