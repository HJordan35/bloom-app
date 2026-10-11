// Writes each bro's 3 monthly insights with a research agent (Monthly Summary, phase S1).
// POST with an x-insights-secret header:
//   { month: "2026-09" }                          → 202, then runs every bro (one call each)
//   { month: "2026-09", bro_id }                  → 202, runs that bro and saves the insights
//   { month: "2026-09", bro_id, dry_run: true }   → runs that bro and returns the insights, saves nothing
// Deploy: npx supabase functions deploy insights --no-verify-jwt --project-ref <ref>
import { createClient } from "npm:@supabase/supabase-js@2";
import { PROMPT_VERSION, SYSTEM_PROMPT } from "./prompt.ts";
import { buildSnapshot, monthBounds } from "./snapshot.ts";
import { checkSubmission, cleanSubmission, runTool, TOOLS } from "./tools.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

// Gemini, on the same API key as studio-photo
const MODEL = "gemini-3.8-flash";
const THINKING_LEVEL = "medium";
const MAX_TURNS = 10;
const SECRET = Deno.env.get("INSIGHTS_SECRET");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

type Trace = { tool: string; input: unknown; error?: string; chars?: number }[];

Deno.serve(async (req) => {
  // Only callers with the secret (the gateway JWT check is off, see the deploy line)
  if (!SECRET || req.headers.get("x-insights-secret") !== SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { month, bro_id, dry_run } = await req.json();
  if (!/^\d{4}-\d{2}$/.test(month ?? "")) return json({ error: "month must be YYYY-MM" }, 400);

  if (dry_run) {
    if (!bro_id) return json({ error: "dry_run needs a bro_id" }, 400);
    return json(await agent(bro_id, month));
  }

  EdgeRuntime.waitUntil(
    (bro_id ? run(bro_id, month) : fanOut(month)).catch((e) =>
      console.error(`insights failed for ${bro_id ?? "all"} ${month}:`, e),
    ),
  );
  return json({ status: "started" }, 202);
});

/** One call per bro, so each agent run gets its own time limit. */
async function fanOut(month: string) {
  const { data: bros, error } = await supabase.from("bros").select("id");
  if (error) throw error;
  await Promise.all(
    bros.map((bro) =>
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/insights`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-insights-secret": SECRET ?? "" },
        body: JSON.stringify({ month, bro_id: bro.id }),
      }),
    ),
  );
}

/** Record a run, let the agent work, then save its insights (or the failure). */
async function run(broId: string, month: string) {
  const { data: row, error } = await supabase
    .from("insight_runs")
    .insert({
      bro_id: broId,
      month: monthBounds(month).day,
      model: MODEL,
      prompt_version: PROMPT_VERSION,
    })
    .select("id")
    .single();
  if (error) throw error;

  try {
    const { insights, usage, trace } = await agent(broId, month);
    const saved = await supabase.from("insights").insert(
      insights.map((insight, i) => ({
        run_id: row.id,
        bro_id: broId,
        month: monthBounds(month).day,
        position: i + 1,
        ...insight,
      })),
    );
    if (saved.error) throw saved.error;
    await supabase
      .from("insight_runs")
      .update({ status: "succeeded", usage, trace, finished_at: new Date().toISOString() })
      .eq("id", row.id);
  } catch (e) {
    await supabase
      .from("insight_runs")
      .update({ status: "failed", error: String(e), finished_at: new Date().toISOString() })
      .eq("id", row.id);
    throw e;
  }
}

type Step = {
  type: string;
  id?: string;
  name?: string;
  arguments?: Record<string, string | number | undefined>;
  queries?: string[];
};
type Interaction = {
  id: string;
  status: string;
  steps?: Step[];
  usage?: Record<string, number>;
};
type FunctionResult = {
  type: "function_result";
  call_id: string;
  name: string;
  result: string;
  is_error?: boolean;
};

/** The agent loop: snapshot in, tools until it hands in 3 valid insights. */
async function agent(broId: string, month: string) {
  const started = Date.now();
  const snapshot = await buildSnapshot(supabase, broId, month);
  const usage = {
    input_tokens: 0,
    output_tokens: 0,
    thought_tokens: 0,
    cached_tokens: 0,
    web_searches: 0,
    turns: 0,
    ms: 0,
  };
  const trace: Trace = [];
  const handled = new Set<string>();

  // Each turn continues the last interaction (Gemini keeps the history), sending only what's new
  let previous: string | undefined;
  let input: string | FunctionResult[] = snapshot.text;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const interaction = await interact(input, previous);
    previous = interaction.id;
    usage.turns = turn;
    usage.input_tokens += interaction.usage?.total_input_tokens ?? 0;
    usage.output_tokens += interaction.usage?.total_output_tokens ?? 0;
    usage.thought_tokens += interaction.usage?.total_thought_tokens ?? 0;
    usage.cached_tokens += interaction.usage?.total_cached_tokens ?? 0;
    if (interaction.status !== "completed" && interaction.status !== "requires_action") {
      throw new Error(`Gemini interaction ${interaction.status}`);
    }

    const steps = interaction.steps ?? [];
    for (const step of steps) {
      if (step.type !== "google_search_call") continue;
      usage.web_searches += 1;
      trace.push({ tool: "google_search", input: step.queries });
    }

    // Only calls we haven't answered yet (in case steps include earlier turns)
    const calls = steps.filter((s) => s.type === "function_call" && !handled.has(s.id ?? ""));
    for (const call of calls) handled.add(call.id ?? "");
    if (calls.length === 0) {
      input = "Hand in the 3 insights with submit_insights.";
      continue;
    }

    // A valid submission ends the job; an invalid one goes back with the reason
    const submit = calls.find((c) => c.name === "submit_insights");
    const problem = submit ? checkSubmission(submit.arguments) : null;
    if (submit)
      trace.push({ tool: "submit_insights", input: submit.arguments, error: problem ?? undefined });
    if (submit && !problem) {
      usage.ms = Date.now() - started;
      return { insights: cleanSubmission(submit.arguments), usage, trace };
    }

    input = await Promise.all(
      calls.map(async (call): Promise<FunctionResult> => {
        const reply = {
          type: "function_result" as const,
          call_id: call.id ?? "",
          name: call.name ?? "",
        };
        if (call === submit) return { ...reply, result: problem ?? "", is_error: true };
        try {
          const result = await runTool(supabase, reply.name, call.arguments ?? {});
          trace.push({ tool: reply.name, input: call.arguments, chars: result.length });
          return { ...reply, result };
        } catch (e) {
          trace.push({ tool: reply.name, input: call.arguments, error: String(e) });
          return { ...reply, result: String(e), is_error: true };
        }
      }),
    );
  }

  throw new Error(`No valid submission after ${MAX_TURNS} turns`);
}

/** One Gemini Interactions API call. The system prompt and tools are sent every turn. */
async function interact(input: string | FunctionResult[], previous?: string) {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "x-goog-api-key": Deno.env.get("GEMINI_API_KEY") ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      system_instruction: SYSTEM_PROMPT,
      tools: TOOLS,
      input,
      previous_interaction_id: previous,
      generation_config: { thinking_level: THINKING_LEVEL },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  return (await res.json()) as Interaction;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
