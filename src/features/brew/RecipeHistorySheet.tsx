import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { brewQueries } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import type { RoastWithRoaster } from "../../api/roasts/roasts.types";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { EmptyState } from "../../components/EmptyState";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { recipeLine, relativeDate } from "../../lib/format";
import { colors, fonts, space } from "../../theme/tokens.stylex";
import { BrewRecipe } from "./BrewStats";

const ALL = "All";

type Props = {
  roast: RoastWithRoaster;
  /** The new brew's method, if chosen: the method filter starts on it. */
  method: string | null;
  onUse: (brew: BrewWithRoast) => void;
  onClose: () => void;
};

/** Every bro's past brews of a roast, dialed in first, to borrow a recipe from. */
export function RecipeHistorySheet({ roast, method, onUse, onClose }: Props) {
  const me = useCurrentBro();
  const { data: brews } = useQuery(brewQueries.forRoast(roast.id));
  const [methodFilter, setMethodFilter] = useState(method ?? ALL);
  // Track who's switched off, so every bro starts on
  const [hiddenBros, setHiddenBros] = useState<Set<string>>(() => new Set());
  const [viewing, setViewing] = useState<BrewWithRoast | null>(null);

  if (viewing) {
    return (
      <Sheet title="Recipe" tall onClose={onClose}>
        <BrewSummary brew={viewing} you={viewing.bro_id === me.id} onUse={() => onUse(viewing)} />
        <Button variant="text" onClick={() => setViewing(null)}>
          ← All brews
        </Button>
      </Sheet>
    );
  }

  const all = brews ?? [];
  const methods = [...new Set([...(method ? [method] : []), ...all.map((b) => b.method)])];
  const bros = [...new Map(all.map((b) => [b.bro.id, b.bro])).values()].sort(
    (a, b) =>
      Number(b.id === me.id) - Number(a.id === me.id) || a.first_name.localeCompare(b.first_name),
  );
  const shown = all
    .filter((b) => methodFilter === ALL || b.method === methodFilter)
    .filter((b) => !hiddenBros.has(b.bro_id))
    // Already newest first, and the sort is stable
    .sort((a, b) => Number(b.dialed_in) - Number(a.dialed_in));

  function toggleBro(id: string) {
    setHiddenBros((hidden) => {
      const next = new Set(hidden);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <Sheet title="Brew history" tall onClose={onClose}>
      <Section label="Method">
        <Chips options={[ALL, ...methods]} value={methodFilter} onChange={setMethodFilter} />
      </Section>

      {bros.length > 1 && (
        <Section label="Bros">
          <div {...stylex.props(styles.bros)}>
            {bros.map((b) => {
              const on = !hiddenBros.has(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={b.id === me.id ? "You" : b.first_name}
                  title={b.id === me.id ? "You" : b.first_name}
                  onClick={() => toggleBro(b.id)}
                  {...stylex.props(styles.bro, !on && styles.broOff)}
                >
                  <Avatar bro={b} selected={on} />
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {brews &&
        (shown.length === 0 ? (
          all.length === 0 ? (
            <EmptyState title="Nothing brewed yet.">No one has brewed {roast.name} yet.</EmptyState>
          ) : (
            <EmptyState title="No matches.">No brews match these filters.</EmptyState>
          )
        ) : (
          <div>
            {shown.map((brew) => (
              <HistoryRow
                key={brew.id}
                brew={brew}
                you={brew.bro_id === me.id}
                onClick={() => setViewing(brew)}
              />
            ))}
          </div>
        ))}
    </Sheet>
  );
}

function HistoryRow({
  brew,
  you,
  onClick,
}: {
  brew: BrewWithRoast;
  you: boolean;
  onClick: () => void;
}) {
  const recipe = recipeLine(brew);
  return (
    <button type="button" onClick={onClick} {...stylex.props(styles.row)}>
      <div {...stylex.props(styles.main)}>
        <span>
          {you ? "You" : brew.bro.first_name} · {brew.method}
          {brew.dialed_in && <span {...stylex.props(styles.dialed)}> ✦</span>}
        </span>
        {recipe && <span {...stylex.props(styles.meta)}>{recipe}</span>}
      </div>
      <span {...stylex.props(styles.side)}>{relativeDate(brew.started_at)}</span>
    </button>
  );
}

function BrewSummary({
  brew,
  you,
  onUse,
}: {
  brew: BrewWithRoast;
  you: boolean;
  onUse: () => void;
}) {
  return (
    <>
      <header {...stylex.props(styles.header)}>
        <p {...stylex.props(styles.eyebrow)}>
          {you ? "You" : brew.bro.first_name} · {relativeDate(brew.started_at)}
        </p>
        <p {...stylex.props(styles.method)}>
          {brew.method}
          {brew.dialed_in && <span {...stylex.props(styles.dialed)}>✦ Dialed in</span>}
        </p>
      </header>

      <BrewRecipe brew={brew} onUse={onUse} />

      {brew.brew_notes && (
        <Section label="Brew notes">
          <p {...stylex.props(styles.notes)}>{brew.brew_notes}</p>
        </Section>
      )}

      {brew.brew_results && (
        <Section label="Results">
          <p {...stylex.props(styles.notes)}>{brew.brew_results}</p>
        </Section>
      )}
    </>
  );
}

const styles = stylex.create({
  bros: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.xs,
    // Line the first avatar up with the edge, not its tap target
    marginInline: -7,
  },
  bro: {
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    cursor: "pointer",
    transition: "opacity 150ms",
  },
  broOff: {
    opacity: 0.5,
  },
  row: {
    width: "100%",
    minHeight: 60,
    display: "flex",
    alignItems: "center",
    gap: space.md,
    paddingBlock: space.sm,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
    color: colors.text,
    textAlign: "left",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  side: {
    flexShrink: 0,
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
  },
  dialed: {
    color: colors.brass,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.xs,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
  method: {
    display: "flex",
    gap: space.md,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  notes: {
    whiteSpace: "pre-wrap",
  },
});
