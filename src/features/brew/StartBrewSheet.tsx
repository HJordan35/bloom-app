import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { brewMutations, brewQueries } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { queryClient } from "../../api/queryClient";
import { roastQueries } from "../../api/roasts/roasts.queries";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { HeaderAction } from "../../components/HeaderAction";
import { HistoryIcon } from "../../components/icons";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import { RecipeFields } from "./BrewFields";
import { brewDraft, recipeFromDraft } from "./draft";
import { RecipeHistorySheet } from "./RecipeHistorySheet";
import { RoastPickerSheet, SelectedRoast } from "./RoastChoice";

type Props = {
  initialRoastId: string | null;
  /** A past brew whose roast, method and recipe to start from. */
  initialRecipeId?: string | null;
  onClose: () => void;
  onStarted: () => void;
};

export function StartBrewSheet({ initialRoastId, initialRecipeId, onClose, onStarted }: Props) {
  const bro = useCurrentBro();
  const { data: grinders } = useQuery({
    ...brewQueries.history(bro.id),
    select: (history) => history.grinders,
  });
  const startBrew = useMutation(brewMutations.start());

  // Step 1 picks the roast in a library drawer; step 2 is the rest of the brew
  const [picked, setPicked] = useState<RoastWithRoaster | null>(null);
  const [picking, setPicking] = useState(!initialRoastId && !initialRecipeId);
  const [browsing, setBrowsing] = useState(false);
  const [method, setMethod] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => brewDraft());

  // A roast passed in from the Library skips step 1
  const initialRoast = useQuery({
    ...roastQueries.detail(initialRoastId ?? ""),
    enabled: !!initialRoastId,
  });
  // As does a brew whose recipe you chose to use
  const initialRecipe = useQuery({
    ...brewQueries.detail(initialRecipeId ?? ""),
    enabled: !!initialRecipeId,
  });
  const roast = picked ?? initialRoast.data ?? initialRecipe.data?.roast ?? null;

  // Prefill the recipe from your last brew of this roast + method, on choosing either (not
  // in an effect, so a background refresh or a borrowed recipe doesn't overwrite it). Only
  // the latest request lands.
  const prefillRequest = useRef(0);
  function prefill(roastId: string | undefined, method: string | null) {
    const request = ++prefillRequest.current;
    if (!roastId || !method) return;
    queryClient.fetchQuery(brewQueries.lastRecipe(bro.id, roastId, method)).then((last) => {
      if (!last || request !== prefillRequest.current) return;
      const { dose, grindSize, grinder, temp, tempUnit } = brewDraft(last);
      setDraft((d) => ({ ...d, dose, grindSize, grinder, temp, tempUnit }));
    });
  }

  function chooseMethod(choice: string) {
    setMethod(choice);
    prefill(roast?.id, choice);
  }

  /** Borrow a past brew's method and recipe. */
  function applyRecipe(brew: BrewWithRoast) {
    prefillRequest.current++;
    const { dose, grindSize, grinder, temp, tempUnit } = brewDraft(brew);
    setMethod(brew.method);
    setDraft((d) => ({ ...d, dose, grindSize, grinder, temp, tempUnit }));
    setBrowsing(false);
  }

  // Apply that brew's recipe once it loads (not again on a background refresh)
  const recipeApplied = useRef(false);
  useEffect(() => {
    if (!initialRecipe.data || recipeApplied.current) return;
    recipeApplied.current = true;
    applyRecipe(initialRecipe.data);
  });

  async function start() {
    if (!roast || !method) return;
    await startBrew.mutateAsync({
      bro_id: bro.id,
      roast_id: roast.id,
      method,
      ...recipeFromDraft(draft),
    });
    onStarted();
  }

  if (picking) {
    return (
      <RoastPickerSheet
        onClose={onClose}
        onPick={(choice) => {
          setPicked(choice);
          setPicking(false);
          prefill(choice.id, method);
        }}
      />
    );
  }

  if (!roast) return null;

  if (browsing) {
    return (
      <RecipeHistorySheet
        roast={roast}
        method={method}
        onUse={applyRecipe}
        onClose={() => setBrowsing(false)}
      />
    );
  }

  return (
    <Sheet title="Start a brew" onClose={onClose}>
      <SelectedRoast roast={roast} onChange={() => setPicking(true)} />

      <Section label="Method">
        <Chips options={BREW_METHODS} value={method} onChange={chooseMethod} />
      </Section>

      <RecipeFields
        value={draft}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        grinders={grinders}
        action={
          <HeaderAction icon={<HistoryIcon />} onClick={() => setBrowsing(true)}>
            Select recipe
          </HeaderAction>
        }
      />

      <Button onClick={start} disabled={!roast || !method || startBrew.isPending}>
        {startBrew.isPending ? "Starting…" : "Start brewing"}
      </Button>
    </Sheet>
  );
}
