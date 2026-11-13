import * as stylex from "@stylexjs/stylex";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { colors, fonts, layout, radius, space } from "../theme/tokens.stylex";

type Props = {
  title: string;
  /** Fill the screen height, for browsing lists. */
  tall?: boolean;
  /** Quiet controls in the header, before Close. */
  actions?: ReactNode;
  /** Pinned under the scrolling body, and kept above the keyboard: a chat's input. */
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Bottom sheet. Render it only while open. Portaled to <body> so it always covers the
 * screen, whatever its parent view is animating (see FadeIn).
 */
export function Sheet({ title, tall = false, actions, footer, onClose, children }: Props) {
  const keyboard = useKeyboardInset(!!footer);
  return createPortal(
    <div {...stylex.props(styles.root)} style={{ paddingBottom: keyboard }}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        {...stylex.props(styles.backdrop)}
      />
      <section {...stylex.props(styles.panel, tall && styles.tall)}>
        <header {...stylex.props(styles.header)}>
          <h2 {...stylex.props(styles.title)}>{title}</h2>
          <div {...stylex.props(styles.actions)}>
            {actions}
            <button type="button" onClick={onClose} {...stylex.props(styles.close)}>
              Close
            </button>
          </div>
        </header>
        <div {...stylex.props(styles.body, !!footer && styles.bodyAboveFooter)}>{children}</div>
        {footer && <footer {...stylex.props(styles.footer)}>{footer}</footer>}
      </section>
    </div>,
    document.body,
  );
}

/**
 * How much of the screen's bottom the on-screen keyboard covers. Phones don't resize the page
 * for it, so a sheet with a pinned footer lifts itself by this much.
 */
function useKeyboardInset(on: boolean) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!on || !viewport) return;
    const update = () =>
      setInset(Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop));
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [on]);
  return inset;
}

const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const slideUp = stylex.keyframes({
  from: { transform: "translateY(100%)" },
  to: { transform: "translateY(0)" },
});

const styles = stylex.create({
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    borderWidth: 0,
    backgroundColor: "rgba(5, 4, 3, 0.72)",
    animationName: fadeIn,
    animationDuration: "200ms",
  },
  panel: {
    position: "relative",
    width: "100%",
    maxWidth: layout.maxWidth,
    maxHeight: "92dvh",
    // Shrinks to what's left above the keyboard
    minHeight: 0,
    marginInline: "auto",
    display: "flex",
    flexDirection: "column",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.hairline,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    animationName: slideUp,
    animationDuration: "260ms",
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  tall: {
    height: "92dvh",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInline: space.md,
    paddingBlock: space.md,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 20,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: space.xs,
    // The header's padding already gives the row its height
    marginBlock: -10,
  },
  close: {
    minHeight: 44,
    paddingInline: space.sm,
    backgroundColor: "transparent",
    borderWidth: 0,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.muted,
    cursor: "pointer",
  },
  body: {
    overflowY: "auto",
    padding: space.md,
    paddingBottom: `calc(env(safe-area-inset-bottom) + ${space.lg})`,
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  // The footer carries the bottom inset instead
  bodyAboveFooter: {
    flex: 1,
    paddingBottom: space.md,
  },
  footer: {
    padding: space.md,
    paddingBottom: `calc(env(safe-area-inset-bottom) + ${space.md})`,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.hairline,
  },
});
