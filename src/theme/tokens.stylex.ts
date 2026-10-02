import * as stylex from "@stylexjs/stylex";

export const colors = stylex.defineVars({
  bg: "#0D0A08",
  surface: "#16110E",
  surfaceRaised: "#1D1713",
  hairline: "#2B221C",
  text: "#E9E0D2",
  muted: "#8A7D70",
  faint: "#5A4F46",
  brass: "#B8935A",
  leather: "#6F4428",
  ember: "#C8642F",
  danger: "#B5533C",
});

export const fonts = stylex.defineVars({
  display: "'Playfair Display', Georgia, serif",
  ui: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
});

export const space = stylex.defineVars({
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "40px",
});

export const radius = stylex.defineVars({
  sm: "2px",
  md: "6px",
});

export const layout = stylex.defineVars({
  maxWidth: "480px",
  topBar: "56px",
  tabBar: "64px",
});
