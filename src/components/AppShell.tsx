import * as stylex from "@stylexjs/stylex";
import { type ReactNode, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useRealtimeSync } from "../api/realtime";
import { useCurrentBro } from "../lib/auth";
import { clearBadge, refreshPush } from "../lib/push";
import { colors, fonts, layout, space } from "../theme/tokens.stylex";
import { BrosIcon, CupIcon, LibraryIcon } from "./icons";

const TABS: { to: string; label: string; icon: ReactNode }[] = [
  { to: "/", label: "Brew", icon: <CupIcon /> },
  { to: "/library", label: "Library", icon: <LibraryIcon /> },
  { to: "/bros", label: "Bros", icon: <BrosIcon /> },
];

const TITLES: Record<string, string> = {
  "/": "Brew Now",
  "/library": "Library",
  "/bros": "Bros Board",
};

// Detail routes get a back button instead of the wordmark
const DETAIL_TITLES: [prefix: string, title: string][] = [
  ["/brews/", "Brew"],
  ["/library/roasters/", "Roaster"],
  ["/library/roasts/", "Roast"],
  ["/bros/", "Bro"],
];

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const detail = DETAIL_TITLES.find(([prefix]) => pathname.startsWith(prefix));
  const title = detail?.[1] ?? TITLES[pathname] ?? "Bloom";
  const bro = useCurrentBro();
  useRealtimeSync();

  // Keep this device's push subscription saved, and open notification taps (sent by sw.js)
  useEffect(() => {
    refreshPush(bro.id);
    if (!("serviceWorker" in navigator)) return;
    const open = (event: MessageEvent<{ url: string }>) => navigate(event.data.url);
    navigator.serviceWorker.addEventListener("message", open);
    return () => navigator.serviceWorker.removeEventListener("message", open);
  }, [bro.id, navigate]);

  // Opening Bloom, or switching back to it, marks notifications as seen
  useEffect(() => {
    clearBadge();
    const onVisible = () => document.visibilityState === "visible" && clearBadge();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <div {...stylex.props(styles.frame)}>
      <header {...stylex.props(styles.topBar)}>
        {detail ? (
          <button type="button" onClick={() => navigate(-1)} {...stylex.props(styles.back)}>
            ← Back
          </button>
        ) : (
          <span {...stylex.props(styles.mark)}>Bloom</span>
        )}
        <h1 {...stylex.props(styles.title)}>{title}</h1>
      </header>

      <main {...stylex.props(styles.content)}>
        <Outlet />
      </main>

      <nav {...stylex.props(styles.tabBar)}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              stylex.props(styles.tab, isActive && styles.active).className
            }
          >
            {tab.icon}
            <span {...stylex.props(styles.tabLabel)}>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

const styles = stylex.create({
  frame: {
    maxWidth: layout.maxWidth,
    marginInline: "auto",
    minHeight: "100dvh",
    borderInlineWidth: { default: 0, "@media (min-width: 520px)": 1 },
    borderInlineStyle: "solid",
    borderInlineColor: colors.hairline,
  },
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space.md,
    paddingInline: space.md,
    paddingTop: `calc(env(safe-area-inset-top) + ${space.md})`,
    paddingBottom: space.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  mark: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  back: {
    minHeight: 44,
    marginBlock: -12,
    backgroundColor: "transparent",
    borderWidth: 0,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
    cursor: "pointer",
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 22,
    letterSpacing: "0.01em",
  },
  content: {
    paddingInline: space.md,
    paddingTop: space.lg,
    paddingBottom: `calc(${layout.tabBar} + env(safe-area-inset-bottom) + ${space.lg})`,
  },
  tabBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    maxWidth: layout.maxWidth,
    marginInline: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    paddingBottom: "env(safe-area-inset-bottom)",
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.hairline,
  },
  tab: {
    height: layout.tabBar,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    color: colors.muted,
    transition: "color 150ms",
  },
  active: {
    color: colors.brass,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  },
});
