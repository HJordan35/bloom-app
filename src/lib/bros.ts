import type { Bro } from "../api/bros/bros.types";

type Named = Pick<Bro, "id" | "first_name">;

/** "You" for the signed-in bro, otherwise their first name. */
export function broLabel(bro: Named, meId: string) {
  return bro.id === meId ? "You" : bro.first_name;
}

/** Sort bros with you first, then by first name. */
export function youFirst(meId: string) {
  return (a: Named, b: Named) =>
    Number(b.id === meId) - Number(a.id === meId) || a.first_name.localeCompare(b.first_name);
}
