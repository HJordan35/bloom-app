import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { colors, fonts, radius, space } from "../theme/tokens.stylex";

type Props = {
  title: string;
  /** A sentence or two under the title. */
  message?: ReactNode;
  onClose: () => void;
  /** The choices, stacked full width. */
  children: ReactNode;
};

/**
 * A small centred question over everything, sheets included. Render it only while open;
 * tapping outside closes it.
 */
export function Dialog({ title, message, onClose, children }: Props) {
  return createPortal(
    <div {...stylex.props(styles.root)}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        {...stylex.props(styles.backdrop)}
      />
      <section role="dialog" aria-label={title} {...stylex.props(styles.panel)}>
        <h2 {...stylex.props(styles.title)}>{title}</h2>
        {message && <p {...stylex.props(styles.message)}>{message}</p>}
        <div {...stylex.props(styles.actions)}>{children}</div>
      </section>
    </div>,
    document.body,
  );
}

const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const rise = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(8px)" },
  to: { opacity: 1, transform: "translateY(0)" },
});

const styles = stylex.create({
  root: {
    position: "fixed",
    inset: 0,
    // Above Sheet (50), which it usually opens from
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: space.md,
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
    maxWidth: 340,
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
    padding: space.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.md,
    animationName: rise,
    animationDuration: "200ms",
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 20,
  },
  message: {
    fontSize: 13,
    color: colors.muted,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
    marginTop: space.md,
  },
});
