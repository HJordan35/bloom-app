/** Return Supabase data or throw its error (MVP: happy path only). */
export function unwrap<T>({ data, error }: { data: unknown; error: unknown }) {
  if (error) throw error;
  return data as T;
}

/** Rows keyed by id. Use as a query `select` so the map shares the list's cache entry. */
export function byId<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}
