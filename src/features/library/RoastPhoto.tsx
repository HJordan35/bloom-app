import * as stylex from "@stylexjs/stylex";
import type { Roast } from "../../lib/types";
import { colors, fonts } from "../../theme/tokens.stylex";
import { roastPhotoUrl } from "./photos";

/** The roast's bag photo at 4:5, or a quiet placeholder so gallery tiles line up. */
export function RoastPhoto({ roast }: { roast: Pick<Roast, "name" | "photo_original_path"> }) {
  const url = roastPhotoUrl(roast);
  return url ? (
    <img src={url} alt="" loading="lazy" decoding="async" {...stylex.props(styles.frame)} />
  ) : (
    <span {...stylex.props(styles.frame, styles.empty)}>{roast.name.charAt(0)}</span>
  );
}

const styles = stylex.create({
  frame: {
    display: "block",
    width: "100%",
    aspectRatio: "4 / 5",
    objectFit: "cover",
    backgroundColor: colors.surfaceRaised,
  },
  empty: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.faint,
  },
});
