import * as stylex from "@stylexjs/stylex";
import type { Brew } from "../../api/brews/brews.types";
import { HeaderAction } from "../../components/HeaderAction";
import { Section } from "../../components/Section";
import { formatTemp, mmss } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";

/** The Recipe section, with a quiet "Use recipe" in its header when `onUse` is given. */
export function BrewRecipe({ brew, onUse }: { brew: Brew; onUse?: () => void }) {
  return (
    <Section
      label="Recipe"
      action={onUse && <HeaderAction onClick={onUse}>Use recipe</HeaderAction>}
    >
      <BrewStats brew={brew} />
    </Section>
  );
}

/** The recipe and process numbers as a two-column grid. */
export function BrewStats({ brew }: { brew: Brew }) {
  const stats: [string, string | null][] = [
    ["Dose", brew.dose_g != null ? `${brew.dose_g} g` : null],
    ["Grind", brew.grind_size],
    ["Grinder", brew.grinder],
    ["Temp", formatTemp(brew)],
    ["Brew time", brew.brew_time_s != null ? mmss(brew.brew_time_s) : null],
    ["Volume", brew.volume_ml != null ? `${brew.volume_ml} ml` : null],
  ];

  return (
    <dl {...stylex.props(styles.stats)}>
      {stats.map(([label, value]) => (
        <div key={label} {...stylex.props(styles.stat)}>
          <dt {...stylex.props(styles.label)}>{label}</dt>
          <dd {...stylex.props(styles.value)}>{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

const styles = stylex.create({
  stats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    rowGap: space.md,
    columnGap: space.md,
    paddingTop: space.sm,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: 11,
    color: colors.muted,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 16,
  },
});
