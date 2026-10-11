import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { brewMutations } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { ProcessFields } from "./BrewFields";
import { brewDraft, notesFromDraft, processFromDraft } from "./draft";

type Props = {
  brew: BrewWithRoast;
  /** Notes kept on the brewing card, not yet saved. */
  notes: string;
  onClose: () => void;
  /** Gets the brew back: by then the refreshed page no longer has it as your open brew. */
  onFinished: (brew: BrewWithRoast) => void;
};

/** Step 1 of finishing: how it was brewed. Results come in the follow-up. */
export function FinishBrewSheet({ brew, notes, onClose, onFinished }: Props) {
  const [draft, setDraft] = useState(() => ({ ...brewDraft(brew), brewNotes: notes }));
  const finishBrew = useMutation(brewMutations.finish());

  async function finish() {
    await finishBrew.mutateAsync({
      id: brew.id,
      process: { ...processFromDraft(draft), ...notesFromDraft(draft) },
    });
    onFinished(brew);
  }

  return (
    <Sheet title="Finish brew" onClose={onClose}>
      <ProcessFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
      <Button onClick={finish} disabled={finishBrew.isPending}>
        {finishBrew.isPending ? "Saving…" : "Finish brew"}
      </Button>
    </Sheet>
  );
}
