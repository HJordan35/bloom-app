import { useSearchParams } from "react-router-dom";
import { LibraryBrowser } from "./LibraryBrowser";

export function LibraryPage() {
  const [params, setParams] = useSearchParams();
  return (
    <LibraryBrowser
      view={params.get("view") === "roasts" ? "roasts" : "roasters"}
      onViewChange={(v) => setParams(v === "roasts" ? { view: v } : {}, { replace: true })}
    />
  );
}
