import { useState } from "react";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import type { Endorsement } from "../../lib/types";
import { endorsementDraft, isEmptyEndorsement, saveEndorsement } from "./draft";
import { EndorsementFields } from "./EndorsementFields";

type Props = {
  roast: { id: string; name: string };
  /** Edit this endorsement; omit to create a new one for `roast`. */
  endorsement?: Endorsement;
  onClose: () => void;
  onSaved: () => void;
};

/** Create or edit an endorsement from anywhere (roast page, endorsement rows). */
export function EndorsementSheet({ roast, endorsement, onClose, onSaved }: Props) {
  const bro = useCurrentBro();
  const [draft, setDraft] = useState(() => endorsementDraft(endorsement));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await saveEndorsement(draft, { existing: endorsement, bro_id: bro.id, roast_id: roast.id });
    onSaved();
  }

  return (
    <Sheet title={endorsement ? "Edit endorsement" : `Endorse ${roast.name}`} onClose={onClose}>
      <EndorsementFields value={draft} onChange={setDraft} showMethod={!endorsement?.brew_id} />
      <Button onClick={save} disabled={busy || isEmptyEndorsement(draft)}>
        {busy ? "Saving…" : endorsement ? "Save" : "Endorse"}
      </Button>
    </Sheet>
  );
}
