import { useState } from "react";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import type { BrewWithRoast } from "../../lib/types";
import { finishBrew } from "./api";
import { ProcessFields } from "./BrewFields";
import { brewDraft, processFromDraft } from "./draft";

type Props = {
  brew: BrewWithRoast;
  onClose: () => void;
  onFinished: () => void;
};

/** Step 1 of finishing: how it was brewed. Results come in the follow-up. */
export function FinishBrewSheet({ brew, onClose, onFinished }: Props) {
  const [draft, setDraft] = useState(() => brewDraft(brew));
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    await finishBrew(brew.id, processFromDraft(draft));
    onFinished();
  }

  return (
    <Sheet title="Finish brew" onClose={onClose}>
      <ProcessFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
      <Button onClick={finish} disabled={busy}>
        {busy ? "Saving…" : "Finish brew"}
      </Button>
    </Sheet>
  );
}
