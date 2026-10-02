import * as stylex from "@stylexjs/stylex";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { colors, fonts, space } from "../theme/tokens.stylex";

type Labelled = { label: string };

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & Labelled) {
  return (
    <Label text={label}>
      <input {...props} {...stylex.props(styles.input)} />
    </Label>
  );
}

export function TextAreaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & Labelled) {
  return (
    <Label text={label}>
      <textarea rows={3} {...props} {...stylex.props(styles.input, styles.textarea)} />
    </Label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & Labelled) {
  return (
    <Label text={label}>
      <select {...props} {...stylex.props(styles.input, styles.select)}>
        {children}
      </select>
    </Label>
  );
}

function Label({ text, children }: { text: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children
    <label {...stylex.props(styles.field)}>
      <span {...stylex.props(styles.label)}>{text}</span>
      {children}
    </label>
  );
}

const styles = stylex.create({
  field: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
    minWidth: 0,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.muted,
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.hairline, ":focus": colors.brass },
    borderRadius: 0,
    outline: "none",
    fontSize: 16, // 16px prevents iOS zoom on focus
    transition: "border-color 150ms",
    "::placeholder": { color: colors.faint },
  },
  textarea: {
    height: "auto",
    paddingBlock: space.sm,
    resize: "vertical",
  },
  select: {
    appearance: "none",
    backgroundColor: colors.surface,
  },
});
