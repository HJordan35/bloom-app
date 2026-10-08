import * as stylex from "@stylexjs/stylex";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { Button } from "../../components/Button";
import { LiveDot } from "../../components/LiveDot";
import { elapsed, recipeLine } from "../../lib/format";
import { useNow } from "../../lib/useNow";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";

type Props = {
  brew: BrewWithRoast;
  onFinish: () => void;
  onDiscard: () => void;
};

export function ActiveBrewCard({ brew, onFinish, onDiscard }: Props) {
  const now = useNow();
  const recipe = recipeLine(brew);

  return (
    <article {...stylex.props(styles.card)}>
      <header {...stylex.props(styles.header)}>
        <span {...stylex.props(styles.status)}>
          <LiveDot /> Brewing · {brew.method}
        </span>
        <span {...stylex.props(styles.timer)}>{elapsed(brew.started_at, now)}</span>
      </header>
      <div>
        <h2 {...stylex.props(styles.roast)}>{brew.roast.name}</h2>
        <p {...stylex.props(styles.meta)}>{brew.roast.roaster.name}</p>
      </div>
      {recipe && <p {...stylex.props(styles.recipe)}>{recipe}</p>}
      <div {...stylex.props(styles.actions)}>
        <Button variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
        <Button onClick={onFinish}>Finish</Button>
      </div>
    </article>
  );
}

const styles = stylex.create({
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.leather,
    borderRadius: radius.md,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.ember,
  },
  timer: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.text,
    fontVariantNumeric: "tabular-nums",
  },
  roast: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 26,
    lineHeight: 1.2,
  },
  meta: {
    fontSize: 13,
    color: colors.muted,
  },
  recipe: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: space.sm,
  },
});
