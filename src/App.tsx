import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

// Phase 1 placeholder: confirms the Supabase connection and schema.
export function App() {
  const [status, setStatus] = useState("Connecting…");

  useEffect(() => {
    supabase
      .from("bros")
      .select("id", { count: "exact", head: true })
      .then(({ count, error }) =>
        setStatus(error ? `Error: ${error.message}` : `Connected · ${count} bros`),
      );
  }, []);

  return (
    <main {...stylex.props(styles.main)}>
      <h1 {...stylex.props(styles.title)}>Bloom</h1>
      <p {...stylex.props(styles.status)}>{status}</p>
    </main>
  );
}

const styles = stylex.create({
  main: {
    minHeight: "100dvh",
    display: "grid",
    placeContent: "center",
    gap: 8,
    textAlign: "center",
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontWeight: 500,
    fontSize: 40,
    letterSpacing: "0.04em",
  },
  status: {
    color: "#8a7d70",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
  },
});
