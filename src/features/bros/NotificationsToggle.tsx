import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";
import { Toggle } from "../../components/Toggle";
import { useCurrentBro } from "../../lib/auth";
import { disablePush, enablePush, type PushState, pushState } from "../../lib/push";
import { colors } from "../../theme/tokens.stylex";

const HINTS: Partial<Record<PushState, string>> = {
  unsupported: "To get notifications, add Bloom to your Home Screen and open it from there.",
  denied: "Notifications are blocked. Allow them for Bloom in your phone's Settings.",
};

/** This device's notifications on/off, shown on your own profile. */
export function NotificationsToggle() {
  const me = useCurrentBro();
  const [state, setState] = useState<PushState | null>(null);

  useEffect(() => {
    pushState().then(setState);
  }, []);

  async function toggle(on: boolean) {
    await (on ? enablePush(me.id) : disablePush());
    setState(await pushState());
  }

  if (!state) return null;
  const hint = HINTS[state];
  if (hint) return <p {...stylex.props(styles.hint)}>{hint}</p>;
  return <Toggle label="Notifications" checked={state === "on"} onChange={toggle} />;
}

const styles = stylex.create({
  hint: {
    fontSize: 14,
    color: colors.muted,
  },
});
