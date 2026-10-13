// The agent's tools (Gemini Interactions API format): three read-only lookups, Google Search,
// and a submit tool to finish — submit_insights for a bro, submit_roast_insight for a new coffee.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { BREW_SELECT, type BrewRow, brewForAgent, json } from "./snapshot.ts";

export const INSIGHT_TYPES = ["did_you_know", "pattern", "recommendation", "fact", "jab"] as const;

export type Insight = {
  type: (typeof INSIGHT_TYPES)[number];
  content: string;
  sources: { title: string; url: string }[];
};

const SOURCES = {
  type: "array",
  items: {
    type: "object",
    properties: { title: { type: "string" }, url: { type: "string" } },
    required: ["title", "url"],
  },
} as const;

const range = {
  from: { type: "string", description: "Inclusive start date, YYYY-MM-DD" },
  to: { type: "string", description: "Exclusive end date, YYYY-MM-DD" },
} as const;

export const TOOLS = [
  {
    type: "function",
    name: "get_brews",
    description:
      "Look up brews beyond this month's snapshot: a bro's history, another bro's brews, or everyone's brews of a roast or method. Newest first, times in Chicago local time, with recipe, brew notes and tasting results.",
    parameters: {
      type: "object",
      properties: {
        bro_id: { type: "string", description: "Only this bro's brews (omit for every bro)" },
        roast_id: { type: "string" },
        method: { type: "string", description: "e.g. V60, Espresso" },
        ...range,
        limit: { type: "integer", description: "Max rows, up to 100 (default 30)" },
      },
    },
  },
  {
    type: "function",
    name: "get_endorsements",
    description:
      "Look up endorsements (a bro's rating out of 10 and note on a roast), by bro, roast and/or date range. Newest first.",
    parameters: {
      type: "object",
      properties: {
        bro_id: { type: "string" },
        roast_id: { type: "string" },
        ...range,
        limit: { type: "integer", description: "Max rows, up to 100 (default 30)" },
      },
    },
  },
  {
    type: "function",
    name: "get_roast",
    description:
      "A roast's details: roaster and location, region, roast level, its group ranking (score, average rating, brew count), and how many times each bro has brewed it.",
    parameters: {
      type: "object",
      properties: { roast_id: { type: "string" } },
      required: ["roast_id"],
    },
  },
  { type: "google_search" },
  {
    type: "function",
    name: "submit_insights",
    description:
      "Hand in the bro's 3 insights. Call this once, when they're final; it ends the job. Rules: exactly 3, at least 2 different types, at most 1 jab, each under 500 characters. List the web pages a fact relies on in its sources (empty when it relies only on Bloom data).",
    parameters: {
      type: "object",
      properties: {
        insights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: [...INSIGHT_TYPES] },
              content: { type: "string" },
              sources: SOURCES,
            },
            required: ["type", "content", "sources"],
          },
        },
      },
      required: ["insights"],
    },
  },
] as const;

/** The roast job's tools: the same lookups and search, with a single-insight submission. */
export const ROAST_TOOLS = [
  ...TOOLS.filter((tool) => !("name" in tool) || tool.name !== "submit_insights"),
  {
    type: "function",
    name: "submit_roast_insight",
    description:
      "Hand in the coffee's one insight. Call this once, when it's final; it ends the job. Under 500 characters. List the web pages a fact relies on in sources (empty when it relies only on Bloom data).",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: [...INSIGHT_TYPES] },
        content: { type: "string" },
        sources: SOURCES,
      },
      required: ["type", "content", "sources"],
    },
  },
] as const;

type Input = Record<string, string | number | undefined>;

/** Runs a lookup tool and returns its result as text for the tool_result. */
export async function runTool(db: SupabaseClient, name: string, input: Input) {
  const limit = Math.min(Number(input.limit ?? 30), 100);

  if (name === "get_brews") {
    let query = db.from("brews").select(BREW_SELECT);
    if (input.bro_id) query = query.eq("bro_id", input.bro_id);
    if (input.roast_id) query = query.eq("roast_id", input.roast_id);
    if (input.method) query = query.ilike("method", String(input.method));
    if (input.from) query = query.gte("started_at", input.from);
    if (input.to) query = query.lt("started_at", input.to);
    const { data, error } = await query.order("started_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return json((data as unknown as BrewRow[]).map(brewForAgent));
  }

  if (name === "get_endorsements") {
    let query = db
      .from("endorsements")
      .select(
        "rating, method, note, created_at, bro:bros(first_name), roast:roasts(id, name, roaster:roasters(name))",
      );
    if (input.bro_id) query = query.eq("bro_id", input.bro_id);
    if (input.roast_id) query = query.eq("roast_id", input.roast_id);
    if (input.from) query = query.gte("created_at", input.from);
    if (input.to) query = query.lt("created_at", input.to);
    const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return json(data);
  }

  if (name === "get_roast") {
    const [roast, ranking, brews] = await Promise.all([
      db
        .from("roasts")
        .select("id, name, region, roast_level, created_at, roaster:roasters(name, location)")
        .eq("id", input.roast_id)
        .maybeSingle(),
      db
        .from("roast_rankings")
        .select("score, avg_rating, rating_count, brew_count")
        .eq("roast_id", input.roast_id)
        .maybeSingle(),
      db.from("brews").select("bro:bros(first_name)").eq("roast_id", input.roast_id),
    ]);
    if (!roast.data) return `No roast ${input.roast_id}`;
    const brewsByBro: Record<string, number> = {};
    for (const b of (brews.data ?? []) as unknown as { bro: { first_name: string } }[]) {
      brewsByBro[b.bro.first_name] = (brewsByBro[b.bro.first_name] ?? 0) + 1;
    }
    return json({ ...roast.data, ranking: ranking.data, brews_by_bro: brewsByBro });
  }

  throw new Error(`Unknown tool ${name}`);
}

/** The reason a submission breaks the rules, or null when it's good. Gemini doesn't enforce the
 * schema, so this checks the shape as well as the rules. */
export function checkSubmission(input: unknown): string | null {
  const insights = (input as { insights?: unknown })?.insights;
  if (!Array.isArray(insights)) return "Pass { insights: [...] }.";
  if (insights.length !== 3) return `Submit exactly 3 insights, not ${insights.length}.`;
  for (const [i, insight] of (insights as Insight[]).entries()) {
    const problem = checkInsight(insight, `Insight ${i + 1}`);
    if (problem) return problem;
  }
  const types = (insights as Insight[]).map((i) => i.type);
  if (new Set(types).size < 2) return "Use at least 2 different types.";
  if (types.filter((t) => t === "jab").length > 1) return "At most 1 jab.";
  return null;
}

/** The reason a submit_roast_insight call breaks the rules, or null when it's good. */
export function checkRoastSubmission(input: unknown): string | null {
  return checkInsight(input as Insight, "The insight");
}

/** One insight's shape and length (Gemini doesn't enforce the schema). */
function checkInsight(insight: Insight | undefined, label: string): string | null {
  if (!(INSIGHT_TYPES as readonly string[]).includes(insight?.type ?? "")) {
    return `${label} has type "${insight?.type}"; use one of ${INSIGHT_TYPES.join(", ")}.`;
  }
  if (typeof insight?.content !== "string" || !insight.content.trim()) {
    return `${label} needs content.`;
  }
  if (insight.content.length > 600) {
    return `${label} is ${insight.content.length} characters; keep it under 500.`;
  }
  if (!Array.isArray(insight.sources ?? [])) return `${label}: sources must be a list.`;
  return null;
}

/** A checked submission with sources defaulted, ready to save. */
export function cleanSubmission(input: unknown): Insight[] {
  return (input as { insights: Insight[] }).insights.map(cleanInsight);
}

export function cleanRoastSubmission(input: unknown): Insight {
  return cleanInsight(input as Insight);
}

function cleanInsight({ type, content, sources }: Insight): Insight {
  return {
    type,
    content: content.trim(),
    sources: (sources ?? []).map(({ title, url }) => ({ title, url })),
  };
}
