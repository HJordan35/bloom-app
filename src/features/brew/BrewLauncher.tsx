import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { brewMutations, brewQueries } from "../../api/brews/brews.queries";
import type { Brew } from "../../api/brews/brews.types";
import { queryClient } from "../../api/queryClient";
import { roastQueries } from "../../api/roasts/roasts.queries";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { Chips } from "../../components/Chips";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import { brewDraft, notesFromDraft, recipeFromDraft } from "./draft";
import { RoastPickerSheet, SelectedRoast } from "./RoastChoice";

type Props = {
  initialRoastId: string | null;
  /** A past brew whose roast, method, recipe and notes to start from. */
  initialRecipeId?: string | null;
  onClose: () => void;
  onStarted: () => void;
};

/**
 * Starts a brew as soon as there's a roast and a method: straight away from a past brew's
 * recipe, otherwise after picking what's missing. Everything else is edited on the brewing card.
 */
export function BrewLauncher({ initialRoastId, initialRecipeId, onClose, onStarted }: Props) {
  const bro = useCurrentBro();
  const startBrew = useMutation(brewMutations.start());

  const [picked, setPicked] = useState<RoastWithRoaster | null>(null);
  const [picking, setPicking] = useState(!initialRoastId && !initialRecipeId);
  // Set on the first tap, so a second tap can't start a second brew
  const [chosen, setChosen] = useState<string | null>(null);

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
  const roast = picked ?? initialRoast.data ?? null;

  async function start(roastId: string, method: string, from: Partial<Brew> | null) {
    const draft = brewDraft(from);
    await startBrew.mutateAsync({
      bro_id: bro.id,
      roast_id: roastId,
      method,
      ...recipeFromDraft(draft),
      ...notesFromDraft(draft),
    });
    onStarted();
  }

  // Start from that brew once it loads (not again on a background refresh)
  const recipeStarted = useRef(false);
  useEffect(() => {
    const source = initialRecipe.data;
    if (!source || recipeStarted.current) return;
    recipeStarted.current = true;
    start(source.roast_id, source.method, source);
  });

  // A link to a brew or roast that's gone: nothing to start from
  const missing = initialRecipe.isError || initialRoast.isError;
  useEffect(() => {
    if (missing) onClose();
  }, [missing, onClose]);

  /** Start with your last recipe for this roast + method (notes start fresh). */
  async function chooseMethod(method: string) {
    if (!roast || chosen) return;
    setChosen(method);
    const last = await queryClient.fetchQuery(brewQueries.lastRecipe(bro.id, roast.id, method));
    await start(roast.id, method, last);
  }

  if (initialRecipeId) return null;

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

  return (
    <Sheet title="Choose a method" onClose={onClose}>
      <SelectedRoast roast={roast} onChange={() => setPicking(true)} />
      <Section label="Method">
        <Chips options={BREW_METHODS} value={chosen} onChange={chooseMethod} />
      </Section>
    </Sheet>
  );
}
