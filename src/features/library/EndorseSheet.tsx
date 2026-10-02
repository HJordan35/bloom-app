import { useState } from "react";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { TextAreaField } from "../../components/Field";
import { RatingInput } from "../../components/RatingInput";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import type { RoastWithRoaster } from "../../lib/types";
import { createEndorsement } from "./api";

type Props = {
  roast: RoastWithRoaster;
  onClose: () => void;
  onSaved: () => void;
};

export function EndorseSheet({ roast, onClose, onSaved }: Props) {
  const bro = useCurrentBro();
  const [method, setMethod] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await createEndorsement({
      bro_id: bro.id,
      roast_id: roast.id,
      method,
      rating,
      note: note.trim() || null,
    });
    onSaved();
  }

  return (
    <Sheet title={`Endorse ${roast.name}`} onClose={onClose}>
      <Section label="Method · optional">
        <Chips
          options={BREW_METHODS}
          value={method}
          onChange={(m) => setMethod(m === method ? null : m)}
        />
      </Section>
      <Section label="Rating · optional">
        <RatingInput value={rating} onChange={setRating} />
      </Section>
      <TextAreaField
        label="Note for the bros"
        placeholder="e.g. Costco has this now"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button onClick={save} disabled={busy || (!rating && !note.trim())}>
        {busy ? "Saving…" : "Endorse"}
      </Button>
    </Sheet>
  );
}
