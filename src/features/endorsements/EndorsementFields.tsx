import { Chips } from "../../components/Chips";
import { TextAreaField } from "../../components/Field";
import { RatingInput } from "../../components/RatingInput";
import { Section } from "../../components/Section";
import { Toggle } from "../../components/Toggle";
import { BREW_METHODS } from "../../lib/constants";
import type { EndorsementDraft } from "./draft";

type Props = {
  value: EndorsementDraft;
  onChange: (value: EndorsementDraft) => void;
  /** Off for brew-linked endorsements, which always take the brew's method. */
  showMethod?: boolean;
  /** Hide the fields behind a "Leave an endorsement" switch, so endorsing is a deliberate choice. */
  toggle?: { on: boolean; onToggle: (on: boolean) => void };
};

export function EndorsementFields({ value, onChange, showMethod = false, toggle }: Props) {
  if (toggle && !toggle.on) {
    return <Toggle label="Leave an endorsement" checked={false} onChange={toggle.onToggle} />;
  }
  return (
    <>
      {toggle && <Toggle label="Leave an endorsement" checked onChange={toggle.onToggle} />}
      {showMethod && (
        <Section label="Method · optional">
          <Chips
            options={BREW_METHODS}
            value={value.method}
            onChange={(m) => onChange({ ...value, method: m === value.method ? null : m })}
          />
        </Section>
      )}
      <Section label="Rating · optional">
        <RatingInput value={value.rating} onChange={(rating) => onChange({ ...value, rating })} />
      </Section>
      <TextAreaField
        label="Note for the bros"
        placeholder="e.g. Costco has this now"
        value={value.note}
        onChange={(e) => onChange({ ...value, note: e.target.value })}
      />
    </>
  );
}
