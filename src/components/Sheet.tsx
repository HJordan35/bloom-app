import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, fonts, layout, radius, space } from "../theme/tokens.stylex";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/** Bottom sheet. Render it only while open. */
export function Sheet({ title, onClose, children }: Props) {
  return (
    <div {...stylex.props(styles.root)}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        {...stylex.props(styles.backdrop)}
      />
      <section {...stylex.props(styles.panel)}>
        <header {...stylex.props(styles.header)}>
          <h2 {...stylex.props(styles.title)}>{title}</h2>
          <button type="button" onClick={onClose} {...stylex.props(styles.close)}>
            Close
          </button>
        </header>
        <div {...stylex.props(styles.body)}>{children}</div>
      </section>
    </div>
  );
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
});
