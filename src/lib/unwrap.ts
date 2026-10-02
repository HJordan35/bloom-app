/** Return Supabase data or throw its error (MVP: happy path only). */
export function unwrap<T>({ data, error }: { data: unknown; error: unknown }) {
  if (error) throw error;
  return data as T;
}
