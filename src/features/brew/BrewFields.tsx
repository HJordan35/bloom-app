import * as stylex from "@stylexjs/stylex";
import { Field, TextAreaField } from "../../components/Field";
import { Section } from "../../components/Section";
import { Toggle } from "../../components/Toggle";
import { UnitToggle } from "../../components/UnitToggle";
import { TEMP_UNITS } from "../../lib/constants";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import type { BrewDraft } from "./draft";

// Controlled form sections over one BrewDraft; each sheet stacks the ones it needs.
type SectionProps = {
  value: BrewDraft;
  onChange: (patch: Partial<BrewDraft>) => void;
};

export function RecipeFields({
  value,
  onChange,
  grinders = [],
}: SectionProps & { grinders?: string[] }) {
  return (
    <Section label="Recipe">
      <div {...stylex.props(styles.grid)}>
        <Field
          label="Dose (g)"
          inputMode="decimal"
          value={value.dose}
          onChange={(e) => onChange({ dose: e.target.value })}
        />
        <Field
          label="Temp"
          inputMode="decimal"
          value={value.temp}
          onChange={(e) => onChange({ temp: e.target.value })}
          suffix={
            <UnitToggle
              options={TEMP_UNITS}
              value={value.tempUnit}
              onChange={(tempUnit) => onChange({ tempUnit })}
              format={(unit) => `°${unit}`}
            />
          }
        />
        <Field
          label="Grind"
          value={value.grindSize}
          onChange={(e) => onChange({ grindSize: e.target.value })}
        />
        <Field
          label="Grinder"
          list="grinders"
          value={value.grinder}
          onChange={(e) => onChange({ grinder: e.target.value })}
        />
      </div>
      <datalist id="grinders">
        {grinders.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
    </Section>
  );
}

/** How it was brewed: time, volume, process notes. */
export function ProcessFields({ value, onChange }: SectionProps) {
  return (
    <Section label="Brew">
      <div {...stylex.props(styles.grid)}>
        <div {...stylex.props(styles.time)}>
          <Field
            label="Min"
            placeholder="3"
            inputMode="numeric"
            value={value.minutes}
            onChange={(e) => onChange({ minutes: e.target.value })}
          />
          <span {...stylex.props(styles.colon)}>:</span>
          <Field
            label="Sec"
            placeholder="30"
            inputMode="numeric"
            value={value.seconds}
            onChange={(e) => onChange({ seconds: e.target.value })}
          />
        </div>
        <Field
          label="Volume (ml)"
          inputMode="decimal"
          value={value.volume}
          onChange={(e) => onChange({ volume: e.target.value })}
        />
      </div>
      <TextAreaField
        label="Brew notes"
        placeholder="Pours, WDT, swirl…"
        value={value.brewNotes}
        onChange={(e) => onChange({ brewNotes: e.target.value })}
      />
    </Section>
  );
}

/** How it turned out: tasting results and dialed in. */
export function OutcomeFields({ value, onChange }: SectionProps) {
  return (
    <Section label="Results">
      <TextAreaField
        label="Tasting notes"
        placeholder="How did it taste?"
        value={value.brewResults}
        onChange={(e) => onChange({ brewResults: e.target.value })}
      />
      <Toggle
        label="Dialed in"
        checked={value.dialedIn}
        onChange={(dialedIn) => onChange({ dialedIn })}
      />
    </Section>
  );
}

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: space.md,
  },
  time: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "end",
    gap: space.xs,
  },
  colon: {
    paddingBottom: 10,
    fontFamily: fonts.mono,
    color: colors.muted,
  },
});
