import * as stylex from "@stylexjs/stylex";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { colors, fonts, space } from "../theme/tokens.stylex";

type Labelled = { label: string };

type FieldProps = InputHTMLAttributes<HTMLInputElement> &
  Labelled & {
    /** Shown at the right end of the input's underline, e.g. a unit toggle. */
    suffix?: ReactNode;
  };

export function Field({ label, suffix, ...props }: FieldProps) {
  return (
    <Label text={label}>
      {suffix ? (
        <span {...stylex.props(styles.row)}>
          <input {...props} {...stylex.props(styles.input, styles.inRow)} />
          {suffix}
        </span>
      ) : (
        <input {...props} {...stylex.props(styles.input)} />
      )}
    </Label>
  );
}

export function TextAreaField({
  label,
  action,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> &
  Labelled & {
    /** Shown at the right end of the label row, e.g. a clear button. */
    action?: ReactNode;
  }) {
  return (
    <Label text={label} action={action}>
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

function Label({
  text,
  action,
  children,
}: {
  text: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children
    <label {...stylex.props(styles.field)}>
      {action ? (
        <span {...stylex.props(styles.labelRow)}>
          <span {...stylex.props(styles.label)}>{text}</span>
          {action}
        </span>
      ) : (
        <span {...stylex.props(styles.label)}>{text}</span>
      )}
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
  labelRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
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
  row: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: { default: colors.hairline, ":focus-within": colors.brass },
    transition: "border-color 150ms",
  },
  inRow: {
    flex: 1,
    minWidth: 0,
    borderBottomWidth: 0,
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
