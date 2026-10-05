import * as stylex from "@stylexjs/stylex";
import { type ReactNode, useState } from "react";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { PlusIcon } from "../../components/icons";
import { Mosaic, Tile } from "../../components/Mosaic";
import { SegmentedControl } from "../../components/SegmentedControl";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import { byRank } from "../../lib/ranking";
import type { Ranking, Roaster, RoastWithRoaster } from "../../lib/types";
import { useData } from "../../lib/useData";
import { useLive } from "../../lib/useLive";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { AddRoasterForm } from "./AddRoasterForm";
import { AddRoastForm } from "./AddRoastForm";
import { fetchLibrary } from "./api";
import { BrewedBy } from "./BrewedBy";
import { RoastPhoto } from "./RoastPhoto";

export type LibraryView = "roasters" | "roasts";

const RECENT_LIMIT = 4;

type Props = {
  /** Controlled view (the Library page keeps it in the URL); uncontrolled when omitted. */
  view?: LibraryView;
  onViewChange?: (view: LibraryView) => void;
  /**
   * Pick mode (Brew Now): tiles select a roast instead of navigating,
   * roaster tiles drill into that roaster's roasts, and a "Recent" row shows first.
   */
  onPick?: (roast: RoastWithRoaster) => void;
};

/** Search + Roasters/Roasts mosaic. Shared by the Library page and the brew roast drawer. */
export function LibraryBrowser({ view: controlledView, onViewChange, onPick }: Props) {
  const bro = useCurrentBro();
  const picking = !!onPick;
  const [localView, setLocalView] = useState<LibraryView>(picking ? "roasts" : "roasters");
  const view = controlledView ?? localView;
  const setView = onViewChange ?? setLocalView;
  const [query, setQuery] = useState("");
  const [roasterFilter, setRoasterFilter] = useState<Roaster | null>(null);
  const [adding, setAdding] = useState(false);
  const { data, reload } = useData(() => fetchLibrary(bro.id), [bro.id]);
  useLive(["roasts"], reload); // studio photos finish developing in the background

  if (!data) return null;
  const { roasters, roasts, roasterScores, roastScores, brosById, recentRoastIds } = data;
  const people = (ranking?: Ranking) => <BrewedBy ranking={ranking} brosById={brosById} max={2} />;

  const q = query.trim().toLowerCase();
  const roastMatches = roasts.filter(
    (r) =>
      (!roasterFilter || r.roaster_id === roasterFilter.id) &&
      [r.name, r.region, r.roaster.name].join(" ").toLowerCase().includes(q),
  );
  const roasterMatches = roasters
    .filter(
      (r) =>
        [r.name, r.location].join(" ").toLowerCase().includes(q) ||
        roastMatches.some((roast) => roast.roaster_id === r.id),
    )
    .sort(byRank(roasterScores));
  const recent =
    picking && !q && !roasterFilter
      ? recentRoastIds
          .map((id) => roasts.find((r) => r.id === id))
          .filter((r): r is RoastWithRoaster => !!r)
          .slice(0, RECENT_LIMIT)
      : [];

  const roastTile = (roast: RoastWithRoaster, showRoaster = false) => (
    <Tile
      key={roast.id}
      {...(onPick ? { onClick: () => onPick(roast) } : { to: `/library/roasts/${roast.id}` })}
      title={roast.name}
      lines={[showRoaster ? roast.roaster.name : roast.region, roast.roast_level]}
      level={roast.roast_level}
      ranking={roastScores.get(roast.id)}
      people={people(roastScores.get(roast.id))}
      media={<RoastPhoto roast={roast} />}
    />
  );

  function closeAdd() {
    setAdding(false);
    reload();
  }

  const addForm =
    view === "roasts" ? (
      <AddRoastForm
        initialName={picking ? query : ""}
        initialRoasterId={roasterFilter?.id}
        onCreated={(roast) => (onPick ? onPick(roast) : closeAdd())}
        onCancel={() => setAdding(false)}
      />
    ) : (
      <AddRoasterForm onCreated={closeAdd} onCancel={() => setAdding(false)} />
    );

  // In the drawer, the add form replaces the grid rather than stacking another sheet
  if (picking && adding) return addForm;

  return (
    <div {...stylex.props(styles.browser)}>
      <div {...stylex.props(styles.controls)}>
        <div {...stylex.props(styles.searchRow)}>
          <input
            type="search"
            placeholder="Search the library"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            {...stylex.props(styles.search)}
          />
          <button
            type="button"
            aria-label={view === "roasts" ? "Add roast" : "Add roaster"}
            title={view === "roasts" ? "Add roast" : "Add roaster"}
            onClick={() => setAdding(true)}
            {...stylex.props(styles.add)}
          >
            <PlusIcon />
          </button>
        </div>
        <SegmentedControl<LibraryView>
          options={[
            { value: "roasters", label: "Roasters" },
            { value: "roasts", label: "Roasts" },
          ]}
          value={view}
          onChange={(v) => {
            setRoasterFilter(null);
            setView(v);
          }}
        />
      </div>

      {recent.length > 0 && (
        <Group label="Recent">
          <Mosaic>{recent.map((roast) => roastTile(roast, true))}</Mosaic>
        </Group>
      )}

      {roasters.length === 0 ? (
        <EmptyState title="The shelf is empty.">Add your first roaster to get started.</EmptyState>
      ) : view === "roasters" ? (
        <Mosaic>
          {roasterMatches.map((roaster) => {
            const own = roasts.filter((r) => r.roaster_id === roaster.id);
            return (
              <Tile
                key={roaster.id}
                {...(picking
                  ? {
                      onClick: () => {
                        setRoasterFilter(roaster);
                        setView("roasts");
                      },
                    }
                  : { to: `/library/roasters/${roaster.id}` })}
                title={roaster.name}
                lines={[roaster.location, `${own.length} ${own.length === 1 ? "roast" : "roasts"}`]}
                ranking={roasterScores.get(roaster.id)}
                people={people(roasterScores.get(roaster.id))}
              />
            );
          })}
        </Mosaic>
      ) : (
        <>
          {roasterFilter && (
            <Button variant="text" onClick={() => setRoasterFilter(null)}>
              ← All roasters
            </Button>
          )}
          {groupRoasts(roasterMatches, roastMatches, roastScores).map(([roaster, group]) => (
            <Group key={roaster.id} label={roaster.name}>
              <Mosaic>{group.map((roast) => roastTile(roast))}</Mosaic>
            </Group>
          ))}
        </>
      )}

      {adding && (
        <Sheet
          title={view === "roasts" ? "New roast" : "New roaster"}
          onClose={() => setAdding(false)}
        >
          {addForm}
        </Sheet>
      )}
    </div>
  );
}

/** Roasts grouped under their roaster, in the roasters' order; empty groups dropped. */
function groupRoasts(
  roasters: Roaster[],
  roasts: RoastWithRoaster[],
  scores: Map<string, Ranking>,
) {
  return roasters
    .map((roaster) => {
      const group = roasts.filter((r) => r.roaster_id === roaster.id).sort(byRank(scores));
      return [roaster, group] as const;
    })
    .filter(([, group]) => group.length > 0);
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section {...stylex.props(styles.group)}>
      <h3 {...stylex.props(styles.groupLabel)}>{label}</h3>
      {children}
    </section>
  );
}

const styles = stylex.create({
  browser: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },
  searchRow: {
    display: "flex",
    gap: space.sm,
  },
  // Same height and hairline as the search box, so it reads as part of the controls
  add: {
    flexShrink: 0,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: { default: colors.surface, ":active": colors.surfaceRaised },
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    color: colors.brass,
    cursor: "pointer",
  },
  search: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingInline: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.hairline, ":focus": colors.brass },
    borderRadius: radius.sm,
    outline: "none",
    fontSize: 16,
    "::placeholder": { color: colors.faint },
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },
  groupLabel: {
    fontFamily: fonts.mono,
    fontWeight: 400,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: colors.brass,
  },
});
