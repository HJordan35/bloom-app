import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { brewMutations, brewQueries } from "../../api/brews/brews.queries";
import type { Brew } from "../../api/brews/brews.types";
import { preferredQueries } from "../../api/preferred/preferred.queries";
import { queryClient } from "../../api/queryClient";
import { roastQueries } from "../../api/roasts/roasts.queries";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import { space } from "../../theme/tokens.stylex";
import { type RecipeSource, SelectRecipeSheet } from "../browse/SelectRecipeSheet";
import { brewDraft, notesFromDraft, recipeFromDraft } from "./draft";
import { RoastPickerSheet, SelectedRoast } from "./RoastChoice";

type Props = {
  initialRoastId: string | null;
  /** A past brew whose roast, method, recipe and notes to start from. */
  initialRecipeId?: string | null;
  /** A preferred recipe to start from, the same way; the brew stays linked to it. */
  initialPreferredId?: string | null;
  onClose: () => void;
  onStarted: () => void;
};

/**
 * Starts a brew: straight away from a past brew or a preferred recipe (its roast and method
 * come with it), otherwise once there's a roast, then Start fresh (with a method) or From
 * recipe. Everything else is edited on the brewing card.
 */
export function BrewLauncher({
  initialRoastId,
  initialRecipeId,
  initialPreferredId,
  onClose,
  onStarted,
}: Props) {
  const bro = useCurrentBro();
  const startBrew = useMutation(brewMutations.start());

  const [picked, setPicked] = useState<RoastWithRoaster | null>(null);
  const startsAtOnce = !!initialRecipeId || !!initialPreferredId;
  const [picking, setPicking] = useState(!initialRoastId && !startsAtOnce);
  // Set on the first tap, so a second tap can't start a second brew
  const [chosen, setChosen] = useState<string | null>(null);
  // The method tapped, if any: Start fresh needs it; From recipe starts filtered to it
  const [method, setMethod] = useState<string | null>(null);
  const [browsing, setBrowsing] = useState(false);

  // A roast passed in from the Library skips the picker
  const initialRoast = useQuery({
    ...roastQueries.detail(initialRoastId ?? ""),
    enabled: !!initialRoastId,
  });
  // A past brew's recipe skips both pickers
  const initialRecipe = useQuery({
    ...brewQueries.detail(initialRecipeId ?? ""),
    enabled: !!initialRecipeId,
  });
  const initialPreferred = useQuery({
    ...preferredQueries.detail(initialPreferredId ?? ""),
    enabled: !!initialPreferredId,
  });
  const roast = picked ?? initialRoast.data ?? null;
  // Every bro's preferred recipes for this roast: they mark their methods
  const { data: preferred = [] } = useQuery({
    ...preferredQueries.list({ roastId: roast?.id }),
    enabled: !!roast,
  });

  async function start(
    roastId: string,
    method: string,
    from: Partial<Brew> | null,
    preferredId: string | null = null,
  ) {
    const draft = brewDraft(from);
    await startBrew.mutateAsync({
      bro_id: bro.id,
      roast_id: roastId,
      method,
      ...recipeFromDraft(draft),
      ...notesFromDraft(draft),
      preferred_recipe_id: preferredId,
    });
    onStarted();
  }

  // Start from that brew or recipe once it loads (not again on a background refresh)
  const sourceStarted = useRef(false);
  useEffect(() => {
    if (sourceStarted.current) return;
    const brew = initialRecipe.data;
    const recipe = initialPreferred.data;
    if (brew) start(brew.roast_id, brew.method, brew);
    else if (recipe) start(recipe.roast_id, recipe.method, recipe, recipe.id);
    else return;
    sourceStarted.current = true;
  });

  // A link to a brew, recipe or roast that's gone: nothing to start from
  const missing = initialRecipe.isError || initialPreferred.isError || initialRoast.isError;
  useEffect(() => {
    if (missing) onClose();
  }, [missing, onClose]);

  const marked = [...new Set(preferred.map((r) => r.method))];

  /** Start with your last recipe for this roast + method (notes start fresh). */
  async function fromScratch(method: string) {
    if (!roast || chosen) return;
    setChosen(method);
    const last = await queryClient.fetchQuery(brewQueries.lastRecipe(bro.id, roast.id, method));
    await start(roast.id, method, last);
  }

  /** Start from a recipe picked in Select recipe: a past brew or a preferred recipe. */
  async function fromRecipe(source: RecipeSource, preferredId: string | null) {
    if (!roast || chosen) return;
    setChosen(source.method);
    await start(roast.id, source.method, source, preferredId);
  }

  if (startsAtOnce) return null;

  if (picking) {
    return (
      <RoastPickerSheet
        onClose={picked ? () => setPicking(false) : onClose}
        onPick={(choice) => {
          setPicked(choice);
          setPicking(false);
        }}
      />
    );
  }

  if (!roast) return null;

  if (browsing) {
    return (
      <SelectRecipeSheet
        roast={roast}
        method={method}
        onUse={fromRecipe}
        onClose={() => setBrowsing(false)}
      />
    );
  }

  return (
    <Sheet title="Choose a method" onClose={onClose}>
      <SelectedRoast roast={roast} onChange={() => setPicking(true)} />
      <Section label="Method">
        <Chips
          options={BREW_METHODS}
          value={chosen ?? method}
          onChange={setMethod}
          marked={marked}
        />
      </Section>
      <div {...stylex.props(styles.actions)}>
        {/* A fresh brew needs its method; a recipe brings its own */}
        <Button
          variant="ghost"
          onClick={() => method && fromScratch(method)}
          disabled={!method || !!chosen}
        >
          Start fresh
        </Button>
        <Button variant="ghost" onClick={() => setBrowsing(true)} disabled={!!chosen}>
          From recipe
        </Button>
      </div>
    </Sheet>
  );
}

const styles = stylex.create({
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: space.sm,
  },
});
