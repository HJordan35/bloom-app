import * as stylex from "@stylexjs/stylex";
import { type FormEvent, useState } from "react";
import { Button } from "../../components/Button";
import { FadeIn } from "../../components/FadeIn";
import { Field } from "../../components/Field";
import { useAuth } from "../../lib/auth";
import { colors, fonts, space } from "../../theme/tokens.stylex";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    // On success the auth gate swaps to the app; only failure needs handling here
    if (!(await login(email, password))) {
      setBusy(false);
      setError(true);
    }
  }

  return (
    <FadeIn xstyle={styles.page} as="main">
      <header {...stylex.props(styles.brand)}>
        <span {...stylex.props(styles.rule)} />
        <h1 {...stylex.props(styles.wordmark)}>Bloom</h1>
        <p {...stylex.props(styles.tagline)}>A coffee diary for bros</p>
      </header>

      <form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p {...stylex.props(styles.error)}>Email or password not recognised.</p>}
        <Button type="submit" disabled={busy}>
          {busy ? "Entering…" : "Enter"}
        </Button>
      </form>
    </FadeIn>
  );
}

const styles = stylex.create({
  page: {
    maxWidth: 400,
    minHeight: "100dvh",
    marginInline: "auto",
    paddingInline: space.lg,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: space.xl,
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space.sm,
  },
  rule: {
    width: 40,
    height: 1,
    backgroundColor: colors.brass,
    marginBottom: space.md,
  },
  wordmark: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 52,
    letterSpacing: "0.02em",
    lineHeight: 1,
  },
  tagline: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: colors.muted,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
});
