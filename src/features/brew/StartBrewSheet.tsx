import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { Field } from "../../components/Field";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import { toNumber } from "../../lib/format";
import type { RoastWithRoaster } from "../../lib/types";
import { useData } from "../../lib/useData";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { fetchRoast } from "../library/api";
import { LibraryBrowser } from "../library/LibraryBrowser";
import { fetchLastRecipe, fetchMyBrewHistory, startBrew } from "./api";

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
  const [dose, setDose] = useState("");
  const [grindSize, setGrindSize] = useState("");
  const [grinder, setGrinder] = useState("");
  const [temp, setTemp] = useState("");
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
      setDose(last.dose_g?.toString() ?? "");
      setGrindSize(last.grind_size ?? "");
      setGrinder(last.grinder ?? "");
      setTemp(last.temp_c?.toString() ?? "");
    });
  }, [bro.id, roast, method]);

  async function start() {
    if (!roast || !method) return;
    setBusy(true);
    await startBrew({
      bro_id: bro.id,
      roast_id: roast.id,
      method,
      dose_g: toNumber(dose),
      grind_size: grindSize.trim() || null,
      grinder: grinder.trim() || null,
      temp_c: toNumber(temp),
    });
    onStarted();
  }

  if (picking) {
    return (
      <Sheet title="Choose a roast" tall onClose={onClose}>
        <LibraryBrowser
          onPick={(picked) => {
            setRoast(picked);
            setPicking(false);
          }}
        />
      </Sheet>
    );
  }

  if (!roast) return null;

  return (
    <Sheet title="Start a brew" onClose={onClose}>
      <div {...stylex.props(styles.roast)}>
        <div {...stylex.props(styles.roastText)}>
          <span {...stylex.props(styles.roastName)}>{roast.name}</span>
          <span {...stylex.props(styles.meta)}>
            {[roast.roaster.name, roast.roast_level, roast.region].filter(Boolean).join(" · ")}
          </span>
        </div>
        <Button variant="text" onClick={() => setPicking(true)}>
          Change
        </Button>
      </div>

      <Section label="Method">
        <Chips options={BREW_METHODS} value={method} onChange={setMethod} />
      </Section>

      <Section label="Recipe">
        <div {...stylex.props(styles.grid)}>
          <Field
            label="Dose (g)"
            inputMode="decimal"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
          />
          <Field
            label="Temp (°C)"
            inputMode="decimal"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
          />
          <Field label="Grind" value={grindSize} onChange={(e) => setGrindSize(e.target.value)} />
          <Field
            label="Grinder"
            list="grinders"
            value={grinder}
            onChange={(e) => setGrinder(e.target.value)}
          />
        </div>
        <datalist id="grinders">
          {history.data?.grinders.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </Section>

      <Button onClick={start} disabled={!roast || !method || busy}>
        {busy ? "Starting…" : "Start brewing"}
      </Button>
    </Sheet>
  );
}

const styles = stylex.create({
  roast: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  roastText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  roastName: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 1.2,
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "capitalize",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: space.md,
  },
});
