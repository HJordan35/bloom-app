import { useMutation } from "@tanstack/react-query";
import { preferredMutations } from "../../api/preferred/preferred.queries";
import type { PreferredRecipe } from "../../api/preferred/preferred.types";
import { Button } from "../../components/Button";
import { Dialog } from "../../components/Dialog";
import { recipeName } from "./PreferredRow";

/** Asks before deleting one of your recipes, then deletes it. */
export function DeleteRecipeDialog({
  recipe,
  onCancel,
  onDeleted,
}: {
  recipe: PreferredRecipe;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const remove = useMutation(preferredMutations.remove());

  async function confirm() {
    await remove.mutateAsync(recipe.id);
    onDeleted();
  }

  return (
    <Dialog
      title="Delete this recipe?"
      message={`Your ${recipe.method} recipe, ${recipeName(recipe)}, goes from your bookmarks. Brews made from it stay.`}
      onClose={onCancel}
    >
      <Button variant="ghost" onClick={confirm} disabled={remove.isPending}>
        {remove.isPending ? "Deleting…" : "Delete"}
      </Button>
      <Button variant="text" onClick={onCancel} disabled={remove.isPending}>
        Cancel
      </Button>
    </Dialog>
  );
}
