import { useState } from "react";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import type { PreferredRecipeWithRoast } from "../../api/preferred/preferred.types";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BrowseList } from "../browse/BrowseList";
import type { BrowseFilter } from "../browse/browse";

export type Shared =
  | { kind: "recipe"; recipe: PreferredRecipeWithRoast }
  | { kind: "brew"; brew: BrewWithRoast };

/**
 * A shared item in one line: "V60 · Iced · Guji — Onyx", plus whose it is ("· Sam's",
 * "· yours") when it isn't the sender's own.
 */
export function sharedLine(shared: Shared, senderId: string, meId: string) {
  const item = shared.kind === "recipe" ? shared.recipe : shared.brew;
  const label = shared.kind === "recipe" ? shared.recipe.label : null;
  const owner =
    item.bro_id === senderId ? null : item.bro_id === meId ? "yours" : `${item.bro.first_name}'s`;
  return [item.method, label, `${item.roast.name} — ${item.roast.roaster.name}`, owner]
    .filter(Boolean)
    .join(" · ");
}

/** The shared list, to pick a recipe or brew for the board: starts on your recipes; a tap picks. */
export function ShareSheet({
  onShare,
  onClose,
}: {
  onShare: (shared: Shared) => void;
  onClose: () => void;
}) {
  const me = useCurrentBro();
  const [filter, setFilter] = useState<BrowseFilter>({
    kind: "recipes",
    broIds: [me.id],
    roastId: null,
    methods: [],
  });

  return (
    <Sheet title="Share" tall onClose={onClose}>
      <BrowseList
        filter={filter}
        onFilterChange={(patch) => setFilter((f) => ({ ...f, ...patch }))}
        surface="sheet"
        onOpenRecipe={(recipe) => onShare({ kind: "recipe", recipe })}
        onOpenBrew={(brew) => onShare({ kind: "brew", brew })}
      />
    </Sheet>
  );
}
