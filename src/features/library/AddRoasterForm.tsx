import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { roasterMutations } from "../../api/roasters/roasters.queries";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Field } from "../../components/Field";
import { useCurrentBro } from "../../lib/auth";
import type { Roaster } from "../../lib/types";
import { space } from "../../theme/tokens.stylex";

type Props = {
  onCreated: (roaster: Roaster) => void;
  onCancel: () => void;
};

export function AddRoasterForm({ onCreated, onCancel }: Props) {
  const bro = useCurrentBro();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const create = useMutation(roasterMutations.create());

  async function save() {
    const roaster = await create.mutateAsync({
      name: name.trim(),
      location: location.trim() || null,
      created_by: bro.id,
    });
    onCreated(roaster);
  }

  return (
    <Card>
      <div {...stylex.props(styles.form)}>
        <Field label="Roaster" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Field
          label="Location"
          placeholder="Optional"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <div {...stylex.props(styles.actions)}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!name.trim() || create.isPending}>
            Add roaster
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
