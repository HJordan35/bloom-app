import * as stylex from "@stylexjs/stylex";
import { domToBlob } from "modern-screenshot";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";

// The poster's width in CSS pixels: a large phone, so it lays out like the app
const WIDTH = 430;
// Browsers (iOS Safari especially) refuse canvases much past ~16.7M pixels; fewer pixels also
// draw and encode faster, and 2x is already sharp on a phone
const MAX_PIXELS = 16_000_000;
const MAX_SCALE = 2;
// The charts draw themselves in on mount; capture once they've settled
const SETTLE_MS = 1200;

type Image = { file: File; url: string };

/**
 * Renders `children` off screen as one tall poster, captures it as a PNG, and offers it to share
 * or save. Sharing is its own tap: iOS only opens the share sheet straight after one.
 */
export function ExportSheet({
  fileName,
  onClose,
  children,
}: {
  fileName: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const poster = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<Image | null>(null);
  const [failed, setFailed] = useState(false);
  // Which step it's on, so a slow export shows where the time goes
  const [step, setStep] = useState("Making the image…");

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();
    const log = (label: string) =>
      console.info(`[export] ${label} at ${Math.round(performance.now() - started)}ms`);
    (async () => {
      await document.fonts.ready;
      log("fonts ready");
      setStep("Drawing the charts…");
      await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
      const node = poster.current;
      if (cancelled || !node) return;
      const scale = Math.min(
        MAX_SCALE,
        Math.sqrt(MAX_PIXELS / (node.offsetWidth * node.offsetHeight)),
      );
      log(`capturing ${node.offsetWidth}×${node.offsetHeight} at ${scale.toFixed(2)}x`);
      const blob = await domToBlob(node, {
        scale,
        type: "image/png",
        debug: true, // modern-screenshot's own step timings, in the console
        progress: (current, total) => {
          setStep(`Embedding images and fonts ${current} of ${total}…`);
          if (current === total) {
            log(`embedded ${total} assets`);
            setStep("Rendering…");
          }
        },
      });
      log(`done, ${(blob.size / 1e6).toFixed(1)} MB`);
      if (cancelled) return;
      const file = new File([blob], fileName, { type: "image/png" });
      setImage({ file, url: URL.createObjectURL(file) });
    })().catch((e) => {
      console.error("Brewsletter export failed:", e);
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fileName]);

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );

  async function share() {
    if (!image) return;
    if (navigator.canShare?.({ files: [image.file] })) {
      // Rejects when the share sheet is dismissed; nothing to do
      await navigator.share({ files: [image.file] }).catch(() => {});
      return;
    }
    const link = document.createElement("a");
    link.href = image.url;
    link.download = fileName;
    link.click();
  }

  return (
    <>
      {!image &&
        !failed &&
        createPortal(
          // Off screen on a wrapper: the captured node itself stays in normal flow
          <div {...stylex.props(styles.offscreen)} aria-hidden>
            <div ref={poster} {...stylex.props(styles.poster)}>
              {children}
            </div>
          </div>,
          document.body,
        )}
      <Sheet title="Share the Brewsletter" tall onClose={onClose}>
        {image ? (
          <img
            src={image.url}
            alt="The whole Brewsletter for the month"
            {...stylex.props(styles.preview)}
          />
        ) : (
          <p {...stylex.props(styles.status)}>
            {failed ? "Couldn't make the image. Try again." : step}
          </p>
        )}
        <Button onClick={share} disabled={!image}>
          Share image
        </Button>
      </Sheet>
    </>
  );
}

const styles = stylex.create({
  offscreen: {
    position: "fixed",
    top: 0,
    left: -10000,
    pointerEvents: "none",
  },
  poster: {
    width: WIDTH,
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
    padding: space.md,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  preview: {
    display: "block",
    width: "100%",
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
  },
  status: {
    paddingBlock: space.xl,
    textAlign: "center",
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: colors.muted,
  },
});
