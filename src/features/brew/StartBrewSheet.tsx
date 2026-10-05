import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import type { RoastWithRoaster } from "../../lib/types";
import { useData } from "../../lib/useData";
import { fetchRoast } from "../library/api";
import { fetchLastRecipe, fetchMyBrewHistory, startBrew } from "./api";
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
  const history = useData(() => fetchMyBrewHistory(bro.id), [bro.id]);

  // Step 1 picks the roast in a library drawer; step 2 is the rest of the brew
  const [roast, setRoast] = useState<RoastWithRoaster | null>(null);
  const [picking, setPicking] = useState(!initialRoastId);
  const [method, setMethod] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => brewDraft());
  const [busy, setBusy] = useState(false);

  // A roast passed in from the Library skips step 1
  useEffect(() => {
    if (initialRoastId) fetchRoast(initialRoastId).then(setRoast);
  }, [initialRoastId]);

  // Prefill the recipe from your last brew of this roast + method
  useEffect(() => {
    if (!roast || !method) return;
    fetchLastRecipe(bro.id, roast.id, method).then((last) => {
      if (!last) return;
      const { dose, grindSize, grinder, temp, tempUnit } = brewDraft(last);
      setDraft((d) => ({ ...d, dose, grindSize, grinder, temp, tempUnit }));
    });
  }, [bro.id, roast, method]);

  async function start() {
    if (!roast || !method) return;
    setBusy(true);
    await startBrew({
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
        onPick={(picked) => {
          setRoast(picked);
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
        grinders={history.data?.grinders}
      />

      <Button onClick={start} disabled={!roast || !method || busy}>
        {busy ? "Starting…" : "Start brewing"}
      </Button>
    </Sheet>
  );
}
