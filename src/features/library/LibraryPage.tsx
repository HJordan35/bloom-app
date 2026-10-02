import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Mosaic, Tile } from "../../components/Mosaic";
import { SegmentedControl } from "../../components/SegmentedControl";
import { Sheet } from "../../components/Sheet";
import { useCurrentBro } from "../../lib/auth";
import type { Ranking } from "../../lib/types";
import { useData } from "../../lib/useData";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { AddRoasterForm } from "./AddRoasterForm";
import { AddRoastForm } from "./AddRoastForm";
import { fetchLibrary } from "./api";

type View = "roasters" | "roasts";

const byScore =
  <T extends { id: string; name: string }>(scores: Map<string, Ranking>) =>
  (a: T, b: T) =>
    (scores.get(b.id)?.score ?? 0) - (scores.get(a.id)?.score ?? 0) || a.name.localeCompare(b.name);

export function LibraryPage() {
  const bro = useCurrentBro();
  const [params, setParams] = useSearchParams();
  const view: View = params.get("view") === "roasts" ? "roasts" : "roasters";
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const { data, reload } = useData(() => fetchLibrary(bro.id), [bro.id]);

  if (!data) return null;
  const { roasters, roasts, roasterScores, roastScores, myRoastIds } = data;

  const q = query.trim().toLowerCase();
  const roastMatches = roasts.filter((r) =>
    [r.name, r.region, r.roaster.name].join(" ").toLowerCase().includes(q),
  );
  const roasterMatches = roasters
    .filter(
      (r) =>
        [r.name, r.location].join(" ").toLowerCase().includes(q) ||
        roastMatches.some((roast) => roast.roaster_id === r.id),
    )
    .sort(byScore(roasterScores));

  function closeAdd() {
    setAdding(false);
    reload();
  }

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.controls)}>
        <input
          type="search"
          placeholder="Search the library"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          {...stylex.props(styles.search)}
        />
        <SegmentedControl<View>
          options={[
            { value: "roasters", label: "Roasters" },
            { value: "roasts", label: "Roasts" },
          ]}
          value={view}
          onChange={(v) => setParams(v === "roasts" ? { view: v } : {}, { replace: true })}
        />
      </div>

      {roasters.length === 0 ? (
        <EmptyState title="The shelf is empty.">Add your first roaster to get started.</EmptyState>
      ) : view === "roasters" ? (
        <Mosaic>
          {roasterMatches.map((roaster) => {
            const own = roasts.filter((r) => r.roaster_id === roaster.id);
            return (
              <Tile
                key={roaster.id}
                to={`/library/roasters/${roaster.id}`}
                title={roaster.name}
                lines={[roaster.location, `${own.length} ${own.length === 1 ? "roast" : "roasts"}`]}
                ranking={roasterScores.get(roaster.id)}
                mine={own.some((r) => myRoastIds.has(r.id))}
              />
            );
          })}
        </Mosaic>
      ) : (
        roasterMatches.map((roaster) => {
          const group = roastMatches
            .filter((r) => r.roaster_id === roaster.id)
            .sort(byScore(roastScores));
          if (group.length === 0) return null;
          return (
            <section key={roaster.id} {...stylex.props(styles.group)}>
              <h3 {...stylex.props(styles.groupLabel)}>{roaster.name}</h3>
              <Mosaic>
                {group.map((roast) => (
                  <Tile
                    key={roast.id}
                    to={`/library/roasts/${roast.id}`}
                    title={roast.name}
                    lines={[roast.region, roast.roast_level]}
                    level={roast.roast_level}
                    ranking={roastScores.get(roast.id)}
                    mine={myRoastIds.has(roast.id)}
                  />
                ))}
              </Mosaic>
            </section>
          );
        })
      )}

      <Button variant="ghost" onClick={() => setAdding(true)}>
        + Add {view === "roasts" ? "roast" : "roaster"}
      </Button>

      {adding && (
        <Sheet
          title={view === "roasts" ? "New roast" : "New roaster"}
          onClose={() => setAdding(false)}
        >
          {view === "roasts" ? (
            <AddRoastForm onCreated={closeAdd} onCancel={() => setAdding(false)} />
          ) : (
            <AddRoasterForm onCreated={closeAdd} onCancel={() => setAdding(false)} />
          )}
        </Sheet>
      )}
    </div>
  );
}

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
  },
  search: {
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
