import type { Bro } from "../bros/bros.types";
import type { RoastWithRoaster } from "../roasts/roasts.types";

export type Endorsement = {
  id: string;
  bro_id: string;
  roast_id: string;
  brew_id: string | null;
  method: string | null;
  rating: number | null;
  note: string | null;
  created_at: string;
};

export type EndorsementWithRoast = Endorsement & { bro: Bro; roast: RoastWithRoaster };

export type EndorsementFields = Pick<Endorsement, "method" | "rating" | "note">;
export type NewEndorsement = EndorsementFields &
  Pick<Endorsement, "bro_id" | "roast_id" | "brew_id">;
export type EndorsementUpdate = EndorsementFields & Partial<Pick<Endorsement, "roast_id">>;

export type EndorsementFilter =
  | { roastId: string }
  | { roasterId: string }
  | { broId: string }
  | { brewId: string };
