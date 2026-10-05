import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, fonts, radius, space } from "../theme/tokens.stylex";
import { Scrim } from "./Scrim";

type Props = {
  eyebrow: ReactNode;
  title: string;
  meta?: ReactNode;
  /** A photo behind the title, which is laid over its darkened bottom. */
  media?: ReactNode;
  /** A small control in the photo's top-right corner (e.g. replace photo). */
  mediaAction?: ReactNode;
  children?: ReactNode;
};

export function DetailHeader({ eyebrow, title, meta, media, mediaAction, children }: Props) {
  const text = (
    <>
      <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>
      <h2 {...stylex.props(styles.title)}>{title}</h2>
      {meta && <p {...stylex.props(styles.meta)}>{meta}</p>}
    </>
  );

  return (
    <header {...stylex.props(styles.header)}>
      {media ? (
        <div {...stylex.props(styles.hero)}>
          <div {...stylex.props(styles.media)}>{media}</div>
          <Scrim />
          <div {...stylex.props(styles.heroText)}>{text}</div>
          {mediaAction && <div {...stylex.props(styles.action)}>{mediaAction}</div>}
        </div>
      ) : (
        text
      )}
      {children && <div {...stylex.props(styles.extra)}>{children}</div>}
    </header>
  );
}

const styles = stylex.create({
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
  },
  hero: {
    position: "relative",
    aspectRatio: "4 / 5",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    borderRadius: radius.md,
    overflow: "hidden",
  },
  media: {
    position: "absolute",
    inset: 0,
  },
  heroText: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
    padding: space.md,
  },
  action: {
    position: "absolute",
    top: space.sm,
    right: space.sm,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  title: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 30,
    lineHeight: 1.15,
  },
  meta: {
    fontSize: 13,
    color: colors.muted,
    textTransform: "capitalize",
  },
  extra: {
    marginTop: space.md,
  },
});
