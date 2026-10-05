import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";
import { colors, radius, space } from "../theme/tokens.stylex";

type Props = {
  label: string;
  value: File | null;
  onChange: (file: File) => void;
  /** Shows "Uploading…" and ignores taps. */
  busy?: boolean;
  /** Small pill for laying over a photo, instead of a full-width button. */
  chip?: boolean;
};

/** Pick a photo (camera or library on iOS), with a small preview once chosen. */
export function PhotoPicker({ label, value, onChange, busy = false, chip = false }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!value) return;
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  return (
    <label {...stylex.props(chip ? styles.chip : styles.picker, busy && styles.busy)}>
      {value && preview && <img src={preview} alt="" {...stylex.props(styles.preview)} />}
      <span>{busy ? "Uploading…" : value ? "Change photo" : label}</span>
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        {...stylex.props(styles.input)}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
      />
    </label>
  );
}

const styles = stylex.create({
  picker: {
    minHeight: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    paddingInline: space.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    color: colors.muted,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
  chip: {
    display: "block",
    paddingBlock: 6,
    paddingInline: 10,
    backgroundColor: "rgba(13, 10, 8, 0.6)", // colors.bg, see-through
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    cursor: "pointer",
  },
  busy: {
    cursor: "default",
    opacity: 0.6,
  },
  preview: {
    width: 32,
    height: 40,
    objectFit: "cover",
    borderRadius: radius.sm,
  },
  input: {
    display: "none",
  },
});
