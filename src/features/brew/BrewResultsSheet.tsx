import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import type { BrewWithRoast } from "../../lib/types";
import { space } from "../../theme/tokens.stylex";
import { type EndorsementDraft, endorsementDraft, saveEndorsement } from "../endorsements/draft";
import { EndorsementFields } from "../endorsements/EndorsementFields";
import { updateBrew } from "./api";
import { OutcomeFields } from "./BrewFields";
import { brewDraft, outcomeFromDraft } from "./draft";

type Props = {
  brew: BrewWithRoast;
  onClose: () => void;
  onSaved: () => void;
};

/** Step 2 of finishing: results, dialed in and an endorsement — or "I'll do it later". */
export function BrewResultsSheet({ brew, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState(() => brewDraft(brew));
  const [endorsement, setEndorsement] = useState<EndorsementDraft>(() => ({
    ...endorsementDraft(),
    method: brew.method,
  }));
  const [endorsing, setEndorsing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await updateBrew(brew.id, outcomeFromDraft(draft));
    if (endorsing)
      await saveEndorsement(endorsement, {
        bro_id: brew.bro_id,
        roast_id: brew.roast_id,
        brew_id: brew.id,
      });
    onSaved();
  }

  return (
    <Sheet title="How was it?" onClose={onClose}>
      <OutcomeFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
      <EndorsementFields
        value={endorsement}
        onChange={setEndorsement}
        toggle={{ on: endorsing, onToggle: setEndorsing }}
      />
      <div {...stylex.props(styles.actions)}>
        <Button variant="ghost" onClick={onClose}>
          I'll do it later
        </Button>
        <Button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
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
