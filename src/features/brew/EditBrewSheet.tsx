import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { brewMutations, brewQueries } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import type { Endorsement } from "../../api/endorsements/endorsements.types";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import { type EndorsementDraft, endorsementDraft, saveEndorsement } from "../endorsements/draft";
import { EndorsementFields } from "../endorsements/EndorsementFields";
import { OutcomeFields, ProcessFields, RecipeFields } from "./BrewFields";
import { brewDraft, outcomeFromDraft, processFromDraft, recipeFromDraft } from "./draft";
import { RoastPickerSheet, SelectedRoast } from "./RoastChoice";

type Props = {
  brew: BrewWithRoast;
  /** The endorsement left from this brew, if any. */
  endorsement?: Endorsement;
  onClose: () => void;
  onSaved: () => void;
};

/** Edit every part of your own brew, including its endorsement. */
export function EditBrewSheet({ brew, endorsement, onClose, onSaved }: Props) {
  const bro = useCurrentBro();
  const { data: grinders } = useQuery({
    ...brewQueries.history(bro.id),
    select: (history) => history.grinders,
  });
  const updateBrew = useMutation(brewMutations.update());
  const [roast, setRoast] = useState(brew.roast);
  const [picking, setPicking] = useState(false);
  const [method, setMethod] = useState(brew.method);
  const [draft, setDraft] = useState(() => brewDraft(brew));
  const [endorse, setEndorse] = useState<EndorsementDraft>(() => endorsementDraft(endorsement));
  // An existing endorsement is always shown; a new one is opt-in
  const [endorsing, setEndorsing] = useState(!!endorsement);
  // Held across both writes (brew, then endorsement)
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...p }));

  async function save() {
    setBusy(true);
    await updateBrew.mutateAsync({
      id: brew.id,
      fields: {
        roast_id: roast.id,
        method,
        ...recipeFromDraft(draft),
        ...processFromDraft(draft),
        ...outcomeFromDraft(draft),
      },
    });
    // A brew's endorsement always follows the brew's roast and method
    if (endorsing)
      await saveEndorsement(
        { ...endorse, method },
        { existing: endorsement, bro_id: brew.bro_id, roast_id: roast.id, brew_id: brew.id },
      );
    onSaved();
  }

  if (picking) {
    return (
      <RoastPickerSheet
        onClose={() => setPicking(false)}
        onPick={(picked) => {
          setRoast(picked);
          setPicking(false);
        }}
      />
    );
  }

  return (
    <Sheet title="Edit brew" tall onClose={onClose}>
      <SelectedRoast roast={roast} onChange={() => setPicking(true)} />
      <Section label="Method">
        <Chips options={BREW_METHODS} value={method} onChange={setMethod} />
      </Section>
      <RecipeFields value={draft} onChange={patch} grinders={grinders} />
      <ProcessFields value={draft} onChange={patch} />
      <OutcomeFields value={draft} onChange={patch} />
      <EndorsementFields
        value={endorse}
        onChange={setEndorse}
        toggle={endorsement ? undefined : { on: endorsing, onToggle: setEndorsing }}
      />
      <Button onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save brew"}
      </Button>
    </Sheet>
  );
}
