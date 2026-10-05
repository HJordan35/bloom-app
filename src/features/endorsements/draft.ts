import type { Endorsement } from "../../lib/types";
import { createEndorsement, updateEndorsement } from "./api";

/** Form state for an endorsement, shared by every screen that creates or edits one. */
export type EndorsementDraft = {
  method: string | null;
  rating: number | null;
  note: string;
};

export function endorsementDraft(endorsement?: Endorsement | null): EndorsementDraft {
  return {
    method: endorsement?.method ?? null,
    rating: endorsement?.rating ?? null,
    note: endorsement?.note ?? "",
  };
}

export function isEmptyEndorsement(draft: EndorsementDraft) {
  return draft.rating == null && !draft.note.trim();
}

/**
 * Create, update, or skip: updates `existing` if given, otherwise creates one —
 * unless the draft is empty (no rating and no note), which saves nothing.
 */
export async function saveEndorsement(
  draft: EndorsementDraft,
  target: {
    existing?: Endorsement | null;
    bro_id: string;
    roast_id: string;
    brew_id?: string | null;
  },
) {
  if (isEmptyEndorsement(draft)) return;
  const fields = { method: draft.method, rating: draft.rating, note: draft.note.trim() || null };
  if (target.existing) {
    // roast_id follows a brew whose roast was changed while editing
    await updateEndorsement(target.existing.id, { ...fields, roast_id: target.roast_id });
  } else {
    await createEndorsement({
      ...fields,
      bro_id: target.bro_id,
      roast_id: target.roast_id,
      brew_id: target.brew_id ?? null,
    });
  }
}
