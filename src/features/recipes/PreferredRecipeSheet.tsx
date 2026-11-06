import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { brewQueries } from "../../api/brews/brews.queries";
import type { Brew } from "../../api/brews/brews.types";
import { preferredMutations, preferredQueries } from "../../api/preferred/preferred.queries";
import type {
  PreferredRecipe,
  PreferredRecipeWithRoast,
} from "../../api/preferred/preferred.types";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { Dialog } from "../../components/Dialog";
import { Field } from "../../components/Field";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import { BrewNotesField, ProcessFields, RecipeFields } from "../brew/BrewFields";
import { brewDraft, notesFromDraft, processFromDraft, recipeFromDraft } from "../brew/draft";
import { RoastPickerSheet, SelectedRoast } from "../brew/RoastChoice";
import { DeleteRecipeDialog } from "./DeleteRecipeDialog";
import { recipeName } from "./PreferredRow";

/** What a new recipe starts from: a brew, a bro's recipe, or just a roast. Values are copied. */
export type PreferredStart = {
  roast?: RoastWithRoaster;
  method?: string;
  values?: Partial<Brew>;
};

type Props = {
  /** Your recipe to edit; without it, the sheet saves a new one from `from`. */
  recipe?: PreferredRecipeWithRoast;
  from?: PreferredStart;
  onClose: () => void;
  onSaved: () => void;
};

/** Create or edit one of your preferred recipes. */
export function PreferredRecipeSheet({ recipe, from, onClose, onSaved }: Props) {
  const me = useCurrentBro();
  const { data: grinders } = useQuery({
    ...brewQueries.history(me.id),
    select: (history) => history.grinders,
  });
  const create = useMutation(preferredMutations.create());
  const update = useMutation(preferredMutations.update());

  const [roast, setRoast] = useState(recipe?.roast ?? from?.roast ?? null);
  const [picking, setPicking] = useState(!roast);
  const [method, setMethod] = useState(recipe?.method ?? from?.method ?? null);
  const [label, setLabel] = useState(recipe?.label ?? "");
  const [draft, setDraft] = useState(() => brewDraft(recipe ?? from?.values));
  // Saving a new one beside yours for the same roast + method asks first
  const [asking, setAsking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const patch = (p: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...p }));

  // Yours for this roast + method, to ask about before adding another
  const { data: existing = [] } = useQuery({
    ...preferredQueries.list({
      broIds: [me.id],
      roastId: roast?.id,
      methods: method ? [method] : [],
    }),
    enabled: !!roast && !!method,
  });
  const yours = existing.filter((r) => r.id !== recipe?.id);
  const busy = create.isPending || update.isPending;

  if (picking) {
    return (
      <RoastPickerSheet
        onClose={roast ? () => setPicking(false) : onClose}
        onPick={(picked) => {
          setRoast(picked);
          setAsking(false);
          setPicking(false);
        }}
      />
    );
  }
  if (!roast) return null;

  const fields = {
    roast_id: roast.id,
    method: method ?? "",
    label: label.trim() || null,
    ...recipeFromDraft(draft),
    ...processFromDraft(draft),
    ...notesFromDraft(draft),
  };

  async function save() {
    if (recipe) {
      await update.mutateAsync({ id: recipe.id, fields });
      return onSaved();
    }
    if (yours.length > 0) return setAsking(true);
    await keepBoth();
  }

  async function keepBoth() {
    await create.mutateAsync({ ...fields, bro_id: me.id });
    onSaved();
  }

  /** Overwrite one of yours in place: same recipe, new values. */
  async function replace(target: PreferredRecipe) {
    await update.mutateAsync({ id: target.id, fields });
    onSaved();
  }

  return (
    <Sheet title={recipe ? "Edit preferred recipe" : "Preferred recipe"} tall onClose={onClose}>
      <SelectedRoast roast={roast} onChange={() => setPicking(true)} />
      <Section label="Method">
        <Chips options={BREW_METHODS} value={method} onChange={setMethod} />
      </Section>
      <Field
        label="Label"
        placeholder="Optional, e.g. Comandante or Iced"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <RecipeFields value={draft} onChange={patch} grinders={grinders} />
      <ProcessFields value={draft} onChange={patch} label="Estimate" />
      <BrewNotesField value={draft.brewNotes} onChange={(brewNotes) => patch({ brewNotes })} />

      <Button onClick={save} disabled={busy || !method}>
        {busy ? "Saving…" : recipe ? "Save changes" : "Bookmark recipe"}
      </Button>

      {recipe && (
        <Button variant="text" onClick={() => setDeleting(true)} disabled={busy}>
          Delete
        </Button>
      )}
      {deleting && recipe && (
        <DeleteRecipeDialog
          recipe={recipe}
          onCancel={() => setDeleting(false)}
          onDeleted={onSaved}
        />
      )}
      {asking && (
        <Dialog
          title={yours.length === 1 ? "Replace or keep both?" : "Replace one, or keep all?"}
          message={
            yours.length === 1
              ? `You already have a ${method} recipe for ${roast.name}: ${recipeName(yours[0])}.`
              : `You already have ${yours.length} ${method} recipes for ${roast.name}.`
          }
          onClose={() => setAsking(false)}
        >
          {yours.map((r) => (
            <Button key={r.id} variant="ghost" onClick={() => replace(r)} disabled={busy}>
              Replace{yours.length > 1 && ` ${recipeName(r)}`}
            </Button>
          ))}
          <Button onClick={keepBoth} disabled={busy}>
            {yours.length === 1 ? "Keep both" : "Keep all"}
          </Button>
          <Button variant="text" onClick={() => setAsking(false)} disabled={busy}>
            Cancel
          </Button>
        </Dialog>
      )}
    </Sheet>
  );
}
