import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PreferredRecipeWithRoast } from "../../api/preferred/preferred.types";
import { HeaderAction } from "../../components/HeaderAction";
import { PencilIcon, TrashIcon } from "../../components/icons";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { space } from "../../theme/tokens.stylex";
import { DeleteRecipeDialog } from "./DeleteRecipeDialog";
import { PreferredRecipeSheet } from "./PreferredRecipeSheet";
import { PreferredSummary } from "./PreferredRow";

type Step = "view" | "edit" | "delete" | "save";

/**
 * A preferred recipe opened over the page (the Recipes tab, a recipe shared on the board):
 * Use recipe starts a brew from it; yours can be edited or deleted, anyone else's saved as yours.
 */
export function PreferredRecipeViewer({
  recipe,
  onClose,
}: {
  recipe: PreferredRecipeWithRoast;
  onClose: () => void;
}) {
  const me = useCurrentBro();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("view");

  if (step === "delete") {
    return (
      <DeleteRecipeDialog
        recipe={recipe}
        // Cancel goes back to the recipe
        onCancel={() => setStep("view")}
        onDeleted={onClose}
      />
    );
  }
  if (step === "edit") {
    return <PreferredRecipeSheet recipe={recipe} onClose={onClose} onSaved={onClose} />;
  }
  if (step === "save") {
    return (
      <PreferredRecipeSheet
        from={{ roast: recipe.roast, method: recipe.method, values: recipe }}
        onClose={onClose}
        onSaved={onClose}
      />
    );
  }

  return (
    <Sheet title="Preferred recipe" tall onClose={onClose}>
      <PreferredSummary
        recipe={recipe}
        onUse={() => navigate(`/?preferred=${recipe.id}`)}
        action={
          recipe.bro_id === me.id ? (
            <span {...stylex.props(styles.actions)}>
              <HeaderAction icon={<TrashIcon />} onClick={() => setStep("delete")}>
                Delete
              </HeaderAction>
              <HeaderAction icon={<PencilIcon />} onClick={() => setStep("edit")}>
                Edit
              </HeaderAction>
            </span>
          ) : (
            <HeaderAction onClick={() => setStep("save")}>Save as mine</HeaderAction>
          )
        }
      />
    </Sheet>
  );
}

const styles = stylex.create({
  actions: {
    display: "flex",
    gap: space.md,
  },
});
