import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Chips } from "../../components/Chips";
import { Field, SelectField } from "../../components/Field";
import { useCurrentBro } from "../../lib/auth";
import { ROAST_LEVELS } from "../../lib/constants";
import type { RoastLevel, RoastWithRoaster } from "../../lib/types";
import { useData } from "../../lib/useData";
import { space } from "../../theme/tokens.stylex";
import { AddRoasterForm } from "./AddRoasterForm";
import { createRoast, fetchRoasters } from "./api";

const NEW_ROASTER = "__new";

type Props = {
  initialName?: string;
  initialRoasterId?: string;
  onCreated: (roast: RoastWithRoaster) => void;
  onCancel: () => void;
};

export function AddRoastForm({
  initialName = "",
  initialRoasterId = "",
  onCreated,
  onCancel,
}: Props) {
  const bro = useCurrentBro();
  const roasters = useData(fetchRoasters, []);
  const [roasterId, setRoasterId] = useState(initialRoasterId);
  const [addingRoaster, setAddingRoaster] = useState(false);
  const [name, setName] = useState(initialName);
  const [level, setLevel] = useState<RoastLevel | null>(null);
  const [region, setRegion] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!level) return;
    setBusy(true);
    const roast = await createRoast({
      roaster_id: roasterId,
      name: name.trim(),
      roast_level: level,
      region: region.trim() || null,
      created_by: bro.id,
    });
    onCreated(roast);
  }

  return (
    <Card>
      <div {...stylex.props(styles.form)}>
        {addingRoaster ? (
          <AddRoasterForm
            onCreated={(roaster) => {
              roasters.reload();
              setRoasterId(roaster.id);
              setAddingRoaster(false);
            }}
            onCancel={() => setAddingRoaster(false)}
          />
        ) : (
          <SelectField
            label="Roaster"
            value={roasterId}
            onChange={(e) =>
              e.target.value === NEW_ROASTER ? setAddingRoaster(true) : setRoasterId(e.target.value)
            }
          >
            <option value="" disabled>
              Choose a roaster
            </option>
            {roasters.data?.map((roaster) => (
              <option key={roaster.id} value={roaster.id}>
                {roaster.name}
              </option>
            ))}
            <option value={NEW_ROASTER}>+ New roaster</option>
          </SelectField>
        )}
        <Field label="Roast" value={name} onChange={(e) => setName(e.target.value)} />
        <Chips
          options={ROAST_LEVELS}
          value={level}
          onChange={(value) => setLevel(value as RoastLevel)}
        />
        <Field
          label="Region"
          placeholder="Optional — e.g. Huila, Colombia"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
        <div {...stylex.props(styles.actions)}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!roasterId || !name.trim() || !level || busy}>
            Add roast
          </Button>
        </div>
      </div>
    </Card>
  );
}

const styles = stylex.create({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: space.md,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: space.sm,
  },
});
