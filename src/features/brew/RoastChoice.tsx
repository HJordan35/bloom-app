import * as stylex from "@stylexjs/stylex";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { Button } from "../../components/Button";
import { Sheet } from "../../components/Sheet";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { LibraryBrowser } from "../library/LibraryBrowser";

/** The chosen roast with a "Change" action (start and edit sheets). */
export function SelectedRoast({
  roast,
  onChange,
}: {
  roast: RoastWithRoaster;
  onChange: () => void;
}) {
  return (
    <div {...stylex.props(styles.roast)}>
      <div {...stylex.props(styles.text)}>
        <span {...stylex.props(styles.name)}>{roast.name}</span>
        <span {...stylex.props(styles.meta)}>
          {[roast.roaster.name, roast.roast_level, roast.region].filter(Boolean).join(" · ")}
        </span>
      </div>
      <Button variant="text" onClick={onChange}>
        Change
      </Button>
    </div>
  );
}

/** The library as a tall drawer for picking a roast. */
export function RoastPickerSheet({
  onPick,
  onClose,
}: {
  onPick: (roast: RoastWithRoaster) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title="Choose a roast" tall onClose={onClose}>
      <LibraryBrowser onPick={onPick} />
    </Sheet>
  );
}

const styles = stylex.create({
  roast: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  text: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 1.2,
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "capitalize",
  },
});
