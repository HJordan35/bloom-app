import { useState } from "react";
import type { Brew, BrewWithRoast } from "../../api/brews/brews.types";
import type { PreferredRecipeWithRoast } from "../../api/preferred/preferred.types";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BrewSummary } from "../brew/BrewSummary";
import { PreferredSummary } from "../recipes/PreferredRow";
import { BrowseList } from "./BrowseList";
import type { BrowseFilter } from "./browse";

/** What a recipe is borrowed from: a past brew or a preferred recipe. */
export type RecipeSource = Partial<Brew> & Pick<Brew, "method">;

type Props = {
  roast: RoastWithRoaster;
  /** The brew's method, if chosen: the list starts filtered to it. */
  method: string | null;
  /** `preferredId` is set when the source is a preferred recipe. */
  onUse: (source: RecipeSource, preferredId: string | null) => void;
  onClose: () => void;
};

type Viewing =
  | { kind: "brew"; brew: BrewWithRoast }
  | { kind: "preferred"; recipe: PreferredRecipeWithRoast };

/**
 * The shared list, to borrow a recipe for a brew: Recipes or Brews, starting on yours
 * for this roast and method. Tap one to see it, then Use recipe.
 */
export function SelectRecipeSheet({ roast, method, onUse, onClose }: Props) {
  const me = useCurrentBro();
  const [filter, setFilter] = useState<BrowseFilter>({
    kind: "recipes",
    broIds: [me.id],
    roastId: roast.id,
    methods: method ? [method] : [],
  });
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
          ← All {viewing.kind === "brew" ? "brews" : "recipes"}
        </Button>
      </Sheet>
    );
  }

  return (
    <Sheet title="Select recipe" tall onClose={onClose}>
      <BrowseList
        filter={filter}
        onFilterChange={(patch) => setFilter((f) => ({ ...f, ...patch }))}
        surface="sheet"
        onOpenRecipe={(recipe) => setViewing({ kind: "preferred", recipe })}
        onOpenBrew={(brew) => setViewing({ kind: "brew", brew })}
      />
    </Sheet>
  );
}
