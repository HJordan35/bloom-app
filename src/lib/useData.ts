import { useCallback, useEffect, useState } from "react";

/** Load async data on mount (and when deps change). `reload` refetches. */
export function useData<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T>();
  const [version, setVersion] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: caller controls deps
  useEffect(() => {
    let current = true;
    load().then((result) => {
      if (current) setData(result);
    });
    return () => {
      current = false;
    };
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, reload };
}
