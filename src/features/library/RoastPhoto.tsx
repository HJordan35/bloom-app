import * as stylex from "@stylexjs/stylex";
import type { Roast } from "../../api/roasts/roasts.types";
import { colors, fonts } from "../../theme/tokens.stylex";
import { roastPhoto } from "./photos";

type Props = {
  roast: Pick<Roast, "name" | "photo_original_path" | "photo_path" | "photo_status">;
};

/** The roast's bag photo, filling its parent, or a quiet placeholder so gallery tiles line up. */
export function RoastPhoto({ roast }: Props) {
  const { url, developing } = roastPhoto(roast);
  return (
    <span {...stylex.props(styles.frame)}>
      {url ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          {...stylex.props(styles.image, developing && styles.dimmed)}
        />
      ) : (
        <span {...stylex.props(styles.initial)}>{roast.name.charAt(0)}</span>
      )}
      {developing && <span {...stylex.props(styles.developing)}>Developing…</span>}
    </span>
  );
}

const styles = stylex.create({
  frame: {
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "22%", // above the text laid over the photo's lower half
    width: "100%",
    height: "100%",
    backgroundColor: colors.surfaceRaised,
    overflow: "hidden",
  },
  image: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "opacity 300ms",
  },
  dimmed: {
    opacity: 0.35,
  },
  initial: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.faint,
  },
  developing: {
    position: "relative",
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
});
