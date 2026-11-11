import * as stylex from "@stylexjs/stylex";
import {
  type InputHTMLAttributes,
  type ReactNode,
  type RefObject,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
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

/** A multi-line box that grows with its text, so it never scrolls on its own. */
export function TextAreaField({
  label,
  action,
  minRows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> &
  Labelled & {
    /** Shown at the right end of the label row, e.g. a clear button. */
    action?: ReactNode;
    /** The box's height when empty; it grows from there with its text. */
    minRows?: number;
  }) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutoHeight(ref, props.value);

  return (
    <Label text={label} action={action} htmlFor={id}>
      <textarea
        ref={ref}
        id={id}
        rows={minRows}
        {...props}
        {...stylex.props(styles.input, styles.textarea)}
      />
    </Label>
  );
}

/** Fits a textarea's height to its text, again whenever its width changes the wrapping. */
function useAutoHeight(ref: RefObject<HTMLTextAreaElement | null>, value: unknown) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-fit on each new value
  useLayoutEffect(() => {
    if (ref.current) fit(ref.current);
  }, [ref, value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only width changes: the height it sets itself would otherwise call it again
    let width = el.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (el.offsetWidth === width) return;
      width = el.offsetWidth;
      fit(el);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}

function fit(el: HTMLTextAreaElement) {
  // Back to its rows first, so it can shrink as well as grow
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
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
  htmlFor,
  children,
}: {
  text: string;
  action?: ReactNode;
  /** Names the control, so a tap on the label can't land on the action's button instead. */
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} {...stylex.props(styles.field)}>
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
  // Its height is fitted to the text (see useAutoHeight), so it never scrolls
  textarea: {
    height: "auto",
    paddingBlock: space.sm,
    overflowY: "hidden",
    resize: "none",
  },
  select: {
    appearance: "none",
    backgroundColor: colors.surface,
  },
});
