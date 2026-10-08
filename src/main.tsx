import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { queryClient } from "./api/queryClient";
import "./theme/global.css";

if (import.meta.env.DEV) import("virtual:stylex:runtime");

// Dev only: the query cache inspector, left out of production builds
const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools })),
    )
  : () => null;

// Push notifications (see public/sw.js)
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Suspense>
        <Devtools />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>,
);
