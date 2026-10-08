import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { brewMutations, brewQueries } from "../../api/brews/brews.queries";
import { queryClient } from "../../api/queryClient";
import { roastQueries } from "../../api/roasts/roasts.queries";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import { RecipeFields } from "./BrewFields";
import { brewDraft, recipeFromDraft } from "./draft";
import { RoastPickerSheet, SelectedRoast } from "./RoastChoice";

type Props = {
  initialRoastId: string | null;
  onClose: () => void;
  onStarted: () => void;
};

export function StartBrewSheet({ initialRoastId, onClose, onStarted }: Props) {
  const bro = useCurrentBro();
  const { data: grinders } = useQuery({
    ...brewQueries.history(bro.id),
    select: (history) => history.grinders,
  });
  const startBrew = useMutation(brewMutations.start());

  // Step 1 picks the roast in a library drawer; step 2 is the rest of the brew
  const [picked, setPicked] = useState<RoastWithRoaster | null>(null);
  const [picking, setPicking] = useState(!initialRoastId);
  const [method, setMethod] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => brewDraft());

  // A roast passed in from the Library skips step 1
  const initialRoast = useQuery({
    ...roastQueries.detail(initialRoastId ?? ""),
    enabled: !!initialRoastId,
  });
  const roast = picked ?? initialRoast.data ?? null;

  // Prefill the recipe from your last brew of this roast + method (once per choice, so a
  // background refresh of the roast doesn't overwrite what you've typed)
  const roastId = roast?.id;
  useEffect(() => {
    if (!roastId || !method) return;
    queryClient.fetchQuery(brewQueries.lastRecipe(bro.id, roastId, method)).then((last) => {
      if (!last) return;
      const { dose, grindSize, grinder, temp, tempUnit } = brewDraft(last);
      setDraft((d) => ({ ...d, dose, grindSize, grinder, temp, tempUnit }));
    });
  }, [bro.id, roastId, method]);

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
        }}
      />
    );
  }

  if (!roast) return null;

  return (
    <Sheet title="Start a brew" onClose={onClose}>
      <SelectedRoast roast={roast} onChange={() => setPicking(true)} />

      <Section label="Method">
        <Chips options={BREW_METHODS} value={method} onChange={setMethod} />
      </Section>

      <RecipeFields
        value={draft}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        grinders={grinders}
      />

      <Button onClick={start} disabled={!roast || !method || startBrew.isPending}>
        {startBrew.isPending ? "Starting…" : "Start brewing"}
      </Button>
    </Sheet>
  );
}
