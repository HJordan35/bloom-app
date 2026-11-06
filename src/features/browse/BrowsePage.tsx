import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PreferredRecipeWithRoast } from "../../api/preferred/preferred.types";
import { roastQueries } from "../../api/roasts/roasts.queries";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";
import { FadeIn } from "../../components/FadeIn";
import { HeaderAction } from "../../components/HeaderAction";
import { PencilIcon } from "../../components/icons";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { space } from "../../theme/tokens.stylex";
import { PreferredRecipeSheet, type PreferredStart } from "../recipes/PreferredRecipeSheet";
import { PreferredSummary } from "../recipes/PreferredRow";
import { BrowseList } from "./BrowseList";
import { type BrowseKind, useUrlFilter } from "./browse";

/** What the page has open over it: a recipe, the recipe form, or New's choice. */
type Open =
  | { kind: "view"; recipe: PreferredRecipeWithRoast }
  | { kind: "edit"; recipe: PreferredRecipeWithRoast }
  | { kind: "new"; from: PreferredStart }
  | { kind: "choose" };

/**
 * The shared list as a page: the Recipes tab (`/recipes`) and Browse brews (`/brews`) differ
 * only in which kind they open on. Filters live in the URL.
 */
export function BrowsePage({ defaultKind }: { defaultKind: BrowseKind }) {
  const me = useCurrentBro();
  const navigate = useNavigate();
  const [filter, setFilter] = useUrlFilter(defaultKind);
  const [open, setOpen] = useState<Open | null>(null);
  // The filtered roast, if any, starts a new brew or recipe
  const { data: roast } = useQuery({
    ...roastQueries.detail(filter.roastId ?? ""),
    enabled: !!filter.roastId,
  });

  return (
    <FadeIn xstyle={styles.page}>
      <BrowseList
        filter={filter}
        onFilterChange={setFilter}
        onNew={() => setOpen({ kind: "choose" })}
        onOpenRecipe={(recipe) => setOpen({ kind: "view", recipe })}
        onOpenBrew={(brew) => navigate(`/brews/${brew.id}`)}
      />

      {open?.kind === "view" && (
        <Sheet title="Preferred recipe" tall onClose={() => setOpen(null)}>
          <PreferredSummary
            recipe={open.recipe}
            you={open.recipe.bro_id === me.id}
            onUse={() => navigate(`/?preferred=${open.recipe.id}`)}
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
      {open?.kind === "choose" && (
        <Dialog
          title="New"
          message="Start a brew, or bookmark a recipe."
          onClose={() => setOpen(null)}
        >
          <Button
            variant="ghost"
            // The Brew now flow, on the filtered roast when there is one
            onClick={() => navigate(filter.roastId ? `/?roast=${filter.roastId}` : "/?start")}
          >
            New brew
          </Button>
          <Button
            variant="ghost"
            onClick={() => setOpen({ kind: "new", from: { roast: roast ?? undefined } })}
          >
            New recipe
          </Button>
          <Button variant="text" onClick={() => setOpen(null)}>
            Cancel
          </Button>
        </Dialog>
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
    </FadeIn>
  );
}

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
});
