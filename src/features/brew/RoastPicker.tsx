import * as stylex from "@stylexjs/stylex";
import { type ReactNode, useState } from "react";
import { Button } from "../../components/Button";
import type { RoastWithRoaster } from "../../lib/types";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { AddRoastForm } from "../library/AddRoastForm";

type Props = {
  roasts: RoastWithRoaster[];
  recentIds: string[];
  value: RoastWithRoaster | null;
  onChange: (roast: RoastWithRoaster | null) => void;
};

export function RoastPicker({ roasts, recentIds, value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  if (value) {
    return (
      <div {...stylex.props(styles.selected)}>
        <RoastLabel roast={value} />
        <Button variant="text" onClick={() => onChange(null)}>
          Change
        </Button>
      </div>
    );
  }

  if (adding) {
    return (
      <AddRoastForm
        initialName={query}
        onCreated={(roast) => {
          setAdding(false);
          onChange(roast);
        }}
        onCancel={() => setAdding(false)}
      />
    );
  }

  const q = query.trim().toLowerCase();
  const matches = roasts.filter((r) =>
    `${r.name} ${r.roaster.name} ${r.region ?? ""}`.toLowerCase().includes(q),
  );
  const recent = q
    ? []
    : recentIds
        .slice(0, 5)
        .map((id) => roasts.find((r) => r.id === id))
        .filter((r): r is RoastWithRoaster => !!r);
  const byRoaster = new Map<string, RoastWithRoaster[]>();
  for (const r of matches)
    byRoaster.set(r.roaster.name, [...(byRoaster.get(r.roaster.name) ?? []), r]);
  const groups = [...byRoaster].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div {...stylex.props(styles.picker)}>
      <input
        placeholder="Search roasts or roasters"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        {...stylex.props(styles.search)}
      />
      <div {...stylex.props(styles.list)}>
        {recent.length > 0 && (
          <Group label="Recent">
            {recent.map((roast) => (
              <Option key={roast.id} roast={roast} onPick={onChange} showRoaster />
            ))}
          </Group>
        )}
        {groups.map(([roaster, items]) => (
          <Group key={roaster} label={roaster}>
            {items.map((roast) => (
              <Option key={roast.id} roast={roast} onPick={onChange} />
            ))}
          </Group>
        ))}
        {matches.length === 0 && <p {...stylex.props(styles.empty)}>No roasts found.</p>}
      </div>
      <Button variant="text" onClick={() => setAdding(true)}>
        + New roast
      </Button>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p {...stylex.props(styles.groupLabel)}>{label}</p>
      {children}
    </div>
  );
}

function Option({
  roast,
  onPick,
  showRoaster = false,
}: {
  roast: RoastWithRoaster;
  onPick: (roast: RoastWithRoaster) => void;
  showRoaster?: boolean;
}) {
  return (
    <button type="button" onClick={() => onPick(roast)} {...stylex.props(styles.option)}>
      <span>{roast.name}</span>
      <span {...stylex.props(styles.meta)}>
        {showRoaster ? roast.roaster.name : roast.roast_level}
      </span>
    </button>
  );
}

export function RoastLabel({ roast }: { roast: RoastWithRoaster }) {
  return (
    <div {...stylex.props(styles.label)}>
      <span {...stylex.props(styles.roastName)}>{roast.name}</span>
      <span {...stylex.props(styles.meta)}>
        {roast.roaster.name} · {roast.roast_level}
        {roast.region && ` · ${roast.region}`}
      </span>
    </div>
  );
}

const styles = stylex.create({
  picker: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },
  search: {
    height: 44,
    paddingInline: space.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.hairline, ":focus": colors.brass },
    borderRadius: 2,
    outline: "none",
    fontSize: 16,
  },
  list: {
    maxHeight: 260,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: space.md,
    paddingBlock: space.sm,
  },
  groupLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
    paddingBottom: space.xs,
  },
  option: {
    width: "100%",
    minHeight: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    textAlign: "left",
    cursor: "pointer",
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "capitalize",
  },
  empty: {
    fontSize: 13,
    color: colors.muted,
  },
  selected: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  roastName: {
    fontFamily: fonts.display,
    fontSize: 18,
  },
});
