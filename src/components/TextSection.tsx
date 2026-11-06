import * as stylex from "@stylexjs/stylex";
import { Section } from "./Section";

/** A labelled block of free text (brew notes, results), line breaks kept. Nothing when empty. */
export function TextSection({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <Section label={label}>
      <p {...stylex.props(styles.text)}>{text}</p>
    </Section>
  );
}

const styles = stylex.create({
  text: {
    whiteSpace: "pre-wrap",
  },
});
