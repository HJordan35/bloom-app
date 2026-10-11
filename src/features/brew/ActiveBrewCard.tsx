import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { brewMutations, brewQueries } from "../../api/brews/brews.queries";
import type { BrewWithRoast } from "../../api/brews/brews.types";
import { Button } from "../../components/Button";
import { Chips } from "../../components/Chips";
import { HeaderAction } from "../../components/HeaderAction";
import { HistoryIcon } from "../../components/icons";
import { LiveDot } from "../../components/LiveDot";
import { Section } from "../../components/Section";
import { useCurrentBro } from "../../lib/auth";
import { BREW_METHODS } from "../../lib/constants";
import { elapsed } from "../../lib/format";
import { useNow } from "../../lib/useNow";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { BrewNotesField, RecipeFields } from "./BrewFields";
import { brewDraft, notesFromDraft, recipeFromDraft } from "./draft";
import { RecipeHistorySheet } from "./RecipeHistorySheet";

// How long typing pauses before an edit is saved
const SAVE_DELAY_MS = 600;

type Props = {
  /** Key the card by brew id: it keeps its own edits, so a refetch doesn't reset them. */
  brew: BrewWithRoast;
  /** Called once any pending edit is saved. */
  onFinish: () => void;
  onDiscard: () => void;
};

/** Your open brew: method, recipe and notes stay editable, saved as you go. */
export function ActiveBrewCard({ brew, onFinish, onDiscard }: Props) {
  const now = useNow();
  const bro = useCurrentBro();
  const { data: grinders } = useQuery({
    ...brewQueries.history(bro.id),
    select: (history) => history.grinders,
  });
  const { mutateAsync: updateBrew } = useMutation(brewMutations.update());
  const [method, setMethod] = useState(brew.method);
  const [draft, setDraft] = useState(() => brewDraft(brew));
  const [browsing, setBrowsing] = useState(false);
  const patch = (p: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...p }));

  // Autosave: the latest fields, and the last version written
  const fields = { method, ...recipeFromDraft(draft), ...notesFromDraft(draft) };
  const key = JSON.stringify(fields);
  const latest = useRef({ key, fields });
  latest.current = { key, fields };
  const saved = useRef(key);
  const timer = useRef<number | undefined>(undefined);

  const save = useCallback(async () => {
    window.clearTimeout(timer.current);
    const { key, fields } = latest.current;
    if (key === saved.current) return;
    await updateBrew({ id: brew.id, fields });
    saved.current = key;
  }, [updateBrew, brew.id]);

  useEffect(() => {
    if (key === saved.current) return;
    timer.current = window.setTimeout(save, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer.current);
  }, [key, save]);

  // Don't drop an edit still waiting when the card goes away
  useEffect(() => () => void save(), [save]);

  /** Borrow a past brew's method, recipe and notes. */
  function applyRecipe(source: BrewWithRoast) {
    const { dose, grindSize, grinder, temp, tempUnit, brewNotes } = brewDraft(source);
    setMethod(source.method);
    patch({ dose, grindSize, grinder, temp, tempUnit, brewNotes });
    setBrowsing(false);
  }

  async function finish() {
    await save();
    onFinish();
  }

  return (
    <article {...stylex.props(styles.card)}>
      <header {...stylex.props(styles.header)}>
        <span {...stylex.props(styles.status)}>
          <LiveDot /> Brewing · {method}
        </span>
        <span {...stylex.props(styles.timer)}>{elapsed(brew.started_at, now)}</span>
      </header>
      <div>
        <h2 {...stylex.props(styles.roast)}>{brew.roast.name}</h2>
        <p {...stylex.props(styles.meta)}>{brew.roast.roaster.name}</p>
      </div>
      <Section label="Method">
        <Chips options={BREW_METHODS} value={method} onChange={setMethod} />
      </Section>
      <RecipeFields
        value={draft}
        onChange={patch}
        grinders={grinders}
        action={
          <HeaderAction icon={<HistoryIcon />} onClick={() => setBrowsing(true)}>
            Select recipe
          </HeaderAction>
        }
      />
      <BrewNotesField value={draft.brewNotes} onChange={(brewNotes) => patch({ brewNotes })} />
      <div {...stylex.props(styles.actions)}>
        <Button variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
        <Button onClick={finish}>Finish</Button>
      </div>
      {browsing && (
        <RecipeHistorySheet
          roast={brew.roast}
          method={method}
          onUse={applyRecipe}
          onClose={() => setBrowsing(false)}
        />
      )}
    </article>
  );
}

const styles = stylex.create({
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
    padding: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.leather,
    borderRadius: radius.md,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: space.sm,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.ember,
  },
  timer: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.text,
    fontVariantNumeric: "tabular-nums",
  },
  roast: {
    fontFamily: fonts.display,
    fontWeight: 500,
    fontSize: 26,
    lineHeight: 1.2,
  },
  meta: {
    fontSize: 13,
    color: colors.muted,
  },
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: space.sm,
  },
});
