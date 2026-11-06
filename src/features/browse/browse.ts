import { useSearchParams } from "react-router-dom";
import { useCurrentBro } from "../../lib/auth";

export type BrowseKind = "recipes" | "brews";

/**
 * What a list shows and how it's narrowed. Every part goes to the query, none to the client.
 * An empty `broIds` or `methods` means all of them.
 */
export type BrowseFilter = {
  kind: BrowseKind;
  broIds: string[];
  roastId: string | null;
  methods: string[];
};

/**
 * A page's filter, kept in the URL (`?kind=brews&bro=…&roast=…&method=V60`) so it survives a
 * reload. The kind starts on the page's own; bros default to just you, and all bros is an
 * empty `?bro=`.
 */
export function useUrlFilter(defaultKind: BrowseKind) {
  const me = useCurrentBro();
  const [params, setParams] = useSearchParams();
  const kind = params.get("kind");
  const filter: BrowseFilter = {
    kind: kind === "recipes" || kind === "brews" ? kind : defaultKind,
    broIds: params.has("bro") ? params.getAll("bro").filter(Boolean) : [me.id],
    roastId: params.get("roast"),
    methods: params.getAll("method"),
  };

  function setFilter(patch: Partial<BrowseFilter>) {
    setParams(
      (p) => {
        if (patch.kind) {
          if (patch.kind === defaultKind) p.delete("kind");
          else p.set("kind", patch.kind);
        }
        if (patch.broIds) {
          p.delete("bro");
          for (const id of patch.broIds) p.append("bro", id);
          // Kept even when empty, so "all bros" isn't read back as the default (you)
          if (patch.broIds.length === 0) p.set("bro", "");
        }
        if (patch.roastId !== undefined) {
          if (patch.roastId) p.set("roast", patch.roastId);
          else p.delete("roast");
        }
        if (patch.methods) {
          p.delete("method");
          for (const m of patch.methods) p.append("method", m);
        }
        return p;
      },
      { replace: true },
    );
  }

  return [filter, setFilter] as const;
}
