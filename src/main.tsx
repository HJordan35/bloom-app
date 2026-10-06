import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./theme/global.css";

if (import.meta.env.DEV) import("virtual:stylex:runtime");

// Push notifications (see public/sw.js)
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
