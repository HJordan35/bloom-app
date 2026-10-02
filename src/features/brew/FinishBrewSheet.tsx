import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Button } from "../../components/Button";
import { Field, TextAreaField } from "../../components/Field";
import { RatingInput } from "../../components/RatingInput";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { Toggle } from "../../components/Toggle";
import { parseDuration, toNumber } from "../../lib/format";
import type { BrewWithRoast } from "../../lib/types";
import { space } from "../../theme/tokens.stylex";
import { createEndorsement } from "../library/api";
import { finishBrew } from "./api";

type Props = {
  brew: BrewWithRoast;
  onClose: () => void;
  onFinished: () => void;
};

export function FinishBrewSheet({ brew, onClose, onFinished }: Props) {
  const [brewTime, setBrewTime] = useState("");
  const [volume, setVolume] = useState("");
  const [result, setResult] = useState("");
  const [dialedIn, setDialedIn] = useState(false);
  const [endorsing, setEndorsing] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    await finishBrew(brew.id, {
      brew_time_s: parseDuration(brewTime),
      volume_ml: toNumber(volume),
      result: result.trim() || null,
      dialed_in: dialedIn,
    });
    if (endorsing && (rating || note.trim())) {
      await createEndorsement({
        bro_id: brew.bro_id,
        roast_id: brew.roast_id,
        method: brew.method,
        rating,
        note: note.trim() || null,
      });
    }
    onFinished();
  }

  return (
    <Sheet title="Finish brew" onClose={onClose}>
      <Section label="Result">
        <div {...stylex.props(styles.grid)}>
          <Field
            label="Brew time"
            placeholder="3:30"
            inputMode="numeric"
            value={brewTime}
            onChange={(e) => setBrewTime(e.target.value)}
          />
          <Field
            label="Volume (ml)"
            inputMode="decimal"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
          />
        </div>
        <TextAreaField
          label="Notes"
          placeholder="How did it taste?"
          value={result}
          onChange={(e) => setResult(e.target.value)}
        />
        <Toggle label="Dialed in" checked={dialedIn} onChange={setDialedIn} />
      </Section>

      <Section label={`Endorse · ${brew.method}`}>
        <Toggle label="Leave an endorsement" checked={endorsing} onChange={setEndorsing} />
        {endorsing && (
          <>
            <RatingInput value={rating} onChange={setRating} />
            <TextAreaField
              label="Note for the bros"
              placeholder="Optional"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </>
        )}
      </Section>

      <Button onClick={finish} disabled={busy}>
        {busy ? "Saving…" : "Finish brew"}
      </Button>
    </Sheet>
  );
}

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: space.md,
  },
});
