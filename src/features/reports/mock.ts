// Draft-only: made-up data for /reports/demo while the report's look is worked out. Delete with
// ReportDemoPage once the design is agreed.
import type { Bro } from "../../api/bros/bros.types";
import type { Insight, MonthlyStats, MonthNumbers } from "../../api/reports/reports.types";

export const MOCK_MONTH = "2026-09";

export const MOCK_BROS: Bro[] = [
  { id: "b-alex", first_name: "Alex", last_name: "Reed", email: "" },
  { id: "b-ben", first_name: "Ben", last_name: "Carter", email: "" },
  { id: "b-chris", first_name: "Chris", last_name: "Moss", email: "" },
  { id: "b-dan", first_name: "Dan", last_name: "Price", email: "" },
];

export const MOCK_ME = "b-alex";

const MONTHS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];
const METHODS = ["V60", "Espresso", "AeroPress", "Chemex"];

// Brews per bro per month (Apr → Sep). Dan sits September out.
const BREWS: Record<string, number[]> = {
  "b-alex": [9, 12, 10, 14, 13, 18],
  "b-ben": [6, 8, 11, 9, 10, 12],
  "b-chris": [3, 2, 5, 6, 4, 7],
  "b-dan": [4, 5, 3, 2, 2, 0],
};
// Each bro's method habits, as weights over METHODS
const HABITS: Record<string, number[]> = {
  "b-alex": [5, 3, 1, 1],
  "b-ben": [1, 6, 2, 0],
  "b-chris": [2, 0, 3, 1],
  "b-dan": [3, 1, 0, 2],
};

function split(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const parts = weights.map((w) => Math.floor((total * w) / sum));
  parts[weights.indexOf(Math.max(...weights))] += total - parts.reduce((a, b) => a + b, 0);
  return parts;
}

function monthStats(i: number): MonthlyStats {
  const bros = MOCK_BROS.map((bro, j) => {
    const brews = BREWS[bro.id][i];
    const espresso = split(brews, HABITS[bro.id])[1];
    return {
      bro_id: bro.id,
      first_name: bro.first_name,
      brews,
      // Pour-overs ~250 ml, espresso ~40 ml; 16-18 g a brew
      volume_ml: (brews - espresso) * 250 + espresso * 40,
      beans_g: brews > 0 ? brews * 17 + j : 0,
      dialed_in: Math.floor(brews / 4),
      roasters: i % 3 === j ? 1 : 0,
      roasts: brews > 0 ? (i + j) % 3 : 0,
      endorsements: Math.floor(brews / 3),
      roasts_tried: Math.min(brews, 2 + ((i + j) % 4)),
      first_tries: brews > 0 ? 1 + ((i * j) % 3) : 0,
    };
  }).sort((a, b) => b.brews - a.brews || a.first_name.localeCompare(b.first_name));

  const sum = (key: keyof MonthNumbers) => bros.reduce((total, b) => total + b[key], 0);
  const byMethod = MOCK_BROS.map((bro) => split(BREWS[bro.id][i], HABITS[bro.id]));
  const methods = METHODS.map((method, k) => ({
    method,
    brews: byMethod.reduce((total, counts) => total + counts[k], 0),
    by_bro: MOCK_BROS.map((bro, j) => ({ bro_id: bro.id, brews: byMethod[j][k] }))
      .filter((b) => b.brews > 0)
      .sort((a, b) => b.brews - a.brews),
  }))
    .filter((m) => m.brews > 0)
    .sort((a, b) => b.brews - a.brews);

  return {
    month: `${MONTHS[i]}-01`,
    totals: {
      brews: sum("brews"),
      volume_ml: sum("volume_ml"),
      beans_g: sum("beans_g"),
      dialed_in: sum("dialed_in"),
      roasters: sum("roasters"),
      roasts: sum("roasts"),
      endorsements: sum("endorsements"),
      // Overlap between bros: the group tried fewer distinct roasts than the sum
      roasts_tried: Math.round(sum("roasts_tried") * 0.7),
      first_tries: Math.round(sum("first_tries") * 0.6),
    },
    bros,
    methods,
  };
}

export const MOCK_HISTORY = MONTHS.map((_, i) => monthStats(i));

const insight = (
  position: number,
  type: Insight["type"],
  content: string,
  sources: Insight["sources"] = [],
): Insight => ({ position, type, content, sources });

export const MOCK_INSIGHTS = new Map<string, Insight[]>([
  [
    "b-alex",
    [
      insight(
        1,
        "pattern",
        "Alex brewed 7 of 18 cups on a Monday. Either Mondays are hard, or the V60 is the only thing getting Alex out of bed.",
      ),
      insight(
        2,
        "did_you_know",
        "Every roast Alex tried this month came from Colombia or Ethiopia. Two countries, eleven bags, zero regrets.",
      ),
      insight(
        3,
        "recommendation",
        "Alex's notes said 'a bit sour' three times on the Huila washed. A finer grind (try 2 clicks) or 2°F hotter should pull more sweetness out.",
      ),
    ],
  ],
  [
    "b-ben",
    [
      insight(
        1,
        "fact",
        "Ben's espresso habit lines up with the world: about 60% of coffee drunk worldwide is arabica, and most of Ben's shots were too.",
        [
          {
            title: "Arabica vs robusta — National Coffee Association",
            url: "https://www.ncausa.org",
          },
        ],
      ),
      insight(
        2,
        "jab",
        "Twelve brews, nine of them espresso, four dialed in. Ben's grinder has seen more adjustments than Ben's opinions.",
      ),
      insight(3, "pattern", "Ben never brews before 10am. Coffee, for Ben, is a lunch course."),
    ],
  ],
  [
    "b-chris",
    [
      insight(
        1,
        "did_you_know",
        "Chris tried 3 roasts nobody else in the group has touched — the explorer of the lounge.",
      ),
      insight(
        2,
        "recommendation",
        "Chris's AeroPress brews run 2:30 to 4:00. Pinning it to 2:45 would make the tasting notes comparable.",
      ),
      insight(
        3,
        "fact",
        "AeroPress was invented in 2005 by the same inventor behind the Aerobie flying ring.",
        [{ title: "AeroPress history", url: "https://aeropress.com" }],
      ),
    ],
  ],
  [
    "b-dan",
    [
      insight(1, "jab", "Zero brews in September. Dan's Chemex is now a very elegant vase."),
      insight(
        2,
        "did_you_know",
        "Dan's last brew was August 19th. The bag opened that day is still in the library, slowly becoming a historical artefact.",
      ),
      insight(
        3,
        "recommendation",
        "Ease back in with the roast the group rated highest this month — Alex gave it a 9.",
      ),
    ],
  ],
]);
