import * as stylex from "@stylexjs/stylex";
import { useEffect } from "react";
import { createPortal } from "react-dom";

/** A photo full screen on near-black. Render it only while open; a tap or Esc closes it. */
export function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <button type="button" aria-label="Close photo" onClick={onClose} {...stylex.props(styles.root)}>
      <img src={src} alt="" {...stylex.props(styles.image)} />
    </button>,
    document.body,
  );
}

const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const styles = stylex.create({
  root: {
    position: "fixed",
    inset: 0,
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "env(safe-area-inset-top) 0 env(safe-area-inset-bottom)",
    backgroundColor: "rgba(5, 4, 3, 0.94)",
    borderWidth: 0,
    cursor: "zoom-out",
    animationName: fadeIn,
    animationDuration: "180ms",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
});
