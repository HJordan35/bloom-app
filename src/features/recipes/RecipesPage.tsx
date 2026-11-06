import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { preferredQueries } from "../../api/preferred/preferred.queries";
import type { PreferredRecipeWithRoast } from "../../api/preferred/preferred.types";
import { roastQueries } from "../../api/roasts/roasts.queries";
import { Chips } from "../../components/Chips";
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
import { PreferredRecipeSheet, type PreferredStart } from "./PreferredRecipeSheet";
import { PreferredRow, PreferredSummary } from "./PreferredRow";

const ALL = "All";
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
  | { kind: "filter" };

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

  function setParam(key: string, value: string | null) {
    setParams(
      (p) => {
        if (value) p.set(key, value);
        else p.delete(key);
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
  const methods = [...new Set(listed.map((r) => r.method))];
  const method = methods.find((m) => m === params.get("method")) ?? ALL;
  const shown = listed.filter((r) => method === ALL || r.method === method);
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
        <div {...stylex.props(styles.roastFilter)}>
          <button
            type="button"
            onClick={() => setOpen({ kind: "filter" })}
            {...stylex.props(styles.filter, !!roastId && styles.filterOn)}
          >
            {roastId ? (roast?.name ?? "…") : "All roasts"} ▾
          </button>
          {roastId && (
            <button
              type="button"
              aria-label="All roasts"
              onClick={() => setParam("roast", null)}
              {...stylex.props(styles.filter)}
            >
              ×
            </button>
          )}
        </div>
        {methods.length > 1 && (
          <Chips
            options={[ALL, ...methods]}
            value={method}
            onChange={(m) => setParam("method", m === ALL ? null : m)}
          />
        )}
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
      {open?.kind === "filter" && (
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
    flexDirection: "column",
    gap: space.sm,
  },
  roastFilter: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
  },
  filter: {
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
