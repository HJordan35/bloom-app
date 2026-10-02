import * as stylex from "@stylexjs/stylex";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { useAuth, useCurrentBro } from "../../lib/auth";
import { colors, fonts, space } from "../../theme/tokens.stylex";

export function BrosBoardPage() {
  const { logout } = useAuth();
  const bro = useCurrentBro();

  return (
    <div {...stylex.props(styles.page)}>
      <EmptyState title="Quiet in the lounge.">The board arrives in Phase 5.</EmptyState>
      <Card>
        <p {...stylex.props(styles.label)}>Signed in as</p>
        <p {...stylex.props(styles.name)}>
          {bro.first_name} {bro.last_name}
        </p>
        <p {...stylex.props(styles.email)}>{bro.email}</p>
      </Card>
      <Button variant="ghost" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.md,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.muted,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 20,
    marginTop: space.xs,
  },
  email: {
    fontSize: 13,
    color: colors.muted,
  },
});
