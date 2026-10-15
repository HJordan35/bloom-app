// Writes the monthly insights with a research agent: 3 per bro (Monthly Summary, phase S1) and
// one per coffee new to the group that month (Brewsletter, phase B3).
// POST with an x-insights-secret header:
//   { month: "2026-09" }                           → 202, then runs every bro and new coffee (one call each)
//   { month: "2026-09", scope: "bros" | "roasts" } → 202, runs only that half
//   { month: "2026-09", bro_id | roast_id }         → 202, runs that one and saves the result
//   { month, bro_id | roast_id, dry_run: true }     → runs that one and returns the result, saves nothing
// Each saved run that succeeds then tries to publish the month's Brewsletter (phase S4).
// Deploy: npx supabase functions deploy insights --no-verify-jwt --project-ref <ref>
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  PROMPT_VERSION,
  ROAST_PROMPT_VERSION,
  ROAST_SYSTEM_PROMPT,
  SYSTEM_PROMPT,
} from "./prompt.ts";
import { buildRoastSnapshot, buildSnapshot, monthBounds } from "./snapshot.ts";
import {
  checkRoastSubmission,
  checkSubmission,
  cleanRoastSubmission,
  cleanSubmission,
  ROAST_TOOLS,
  runTool,
  TOOLS,
} from "./tools.ts";

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

/** What the agent loop needs for one kind of insight: instructions, tools, and how it finishes. */
type Job<T> = {
  system: string;
  tools: readonly unknown[];
  snapshot: string;
  submit: string;
  check: (args: unknown) => string | null;
  clean: (args: unknown) => T;
  nudge: string;
};

async function broJob(
  broId: string,
  month: string,
): Promise<Job<ReturnType<typeof cleanSubmission>>> {
  return {
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    snapshot: (await buildSnapshot(supabase, broId, month)).text,
    submit: "submit_insights",
    check: checkSubmission,
    clean: cleanSubmission,
    nudge: "Hand in the 3 insights with submit_insights.",
  };
}

async function roastJob(
  roastId: string,
  month: string,
): Promise<Job<ReturnType<typeof cleanRoastSubmission>>> {
  return {
    system: ROAST_SYSTEM_PROMPT,
    tools: ROAST_TOOLS,
    snapshot: (await buildRoastSnapshot(supabase, roastId, month)).text,
    submit: "submit_roast_insight",
    check: checkRoastSubmission,
    clean: cleanRoastSubmission,
    nudge: "Hand in the insight with submit_roast_insight.",
  };
}

Deno.serve(async (req) => {
  // Only callers with the secret (the gateway JWT check is off, see the deploy line)
  if (!SECRET || req.headers.get("x-insights-secret") !== SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { month, bro_id, roast_id, scope, dry_run } = await req.json();
  if (!/^\d{4}-\d{2}$/.test(month ?? "")) return json({ error: "month must be YYYY-MM" }, 400);

  if (dry_run) {
    if (bro_id) {
      const { result, usage, trace } = await agent(await broJob(bro_id, month));
      return json({ insights: result, usage, trace });
    }
    if (roast_id) {
      const { result, usage, trace } = await agent(await roastJob(roast_id, month));
      return json({ insight: result, usage, trace });
    }
    return json({ error: "dry_run needs a bro_id or roast_id" }, 400);
  }

  const work = bro_id
    ? run(bro_id, month).then(() => publish(month))
    : roast_id
      ? runRoast(roast_id, month).then(() => publish(month))
      : fanOut(month, scope);
  EdgeRuntime.waitUntil(
    work.catch((e) =>
      console.error(`insights failed for ${bro_id ?? roast_id ?? "all"} ${month}:`, e),
    ),
  );
  return json({ status: "started" }, 202);
});

/** One call per bro and per new coffee, so each agent run gets its own time limit. */
async function fanOut(month: string, scope?: "bros" | "roasts") {
  const bodies: Record<string, string>[] = [];
  if (scope !== "roasts") {
    const { data: bros, error } = await supabase.from("bros").select("id");
    if (error) throw error;
    for (const bro of bros) bodies.push({ month, bro_id: bro.id });
  }
  if (scope !== "bros") {
    const { data: roasts, error } = await supabase.rpc("month_new_roasts", {
      p_month: monthBounds(month).day,
    });
    if (error) throw error;
    for (const roast of roasts as { roast_id: string }[])
      bodies.push({ month, roast_id: roast.roast_id });
  }
  await Promise.all(
    bodies.map((body) =>
      fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/insights`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-insights-secret": SECRET ?? "" },
        body: JSON.stringify(body),
      }),
    ),
  );
}

/** Publishes the month if this run was its last missing piece; the new row's webhook sends the push. */
async function publish(month: string) {
  const { error } = await supabase.rpc("publish_report", { p_month: monthBounds(month).day });
  if (error) throw error;
}

/** Record a bro's run, let the agent work, then save its insights (or the failure). */
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
    const { result: insights, usage, trace } = await agent(await broJob(broId, month));
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

/** Record a new coffee's run; the row holds its one insight once the agent hands it in. */
async function runRoast(roastId: string, month: string) {
  const { data: row, error } = await supabase
    .from("roast_insights")
    .insert({
      roast_id: roastId,
      month: monthBounds(month).day,
      model: MODEL,
      prompt_version: ROAST_PROMPT_VERSION,
    })
    .select("id")
    .single();
  if (error) throw error;

  const finished_at = () => new Date().toISOString();
  try {
    const { result: insight, usage, trace } = await agent(await roastJob(roastId, month));
    const saved = await supabase
      .from("roast_insights")
      .update({ status: "succeeded", ...insight, usage, trace, finished_at: finished_at() })
      .eq("id", row.id);
    if (saved.error) throw saved.error;
  } catch (e) {
    await supabase
      .from("roast_insights")
      .update({ status: "failed", error: String(e), finished_at: finished_at() })
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

/** The agent loop: snapshot in, tools until it hands in a valid submission. */
async function agent<T>(job: Job<T>) {
  const started = Date.now();
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
  let input: string | FunctionResult[] = job.snapshot;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const interaction = await interact(job, input, previous);
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
      input = job.nudge;
      continue;
    }

    // A valid submission ends the job; an invalid one goes back with the reason
    const submit = calls.find((c) => c.name === job.submit);
    const problem = submit ? job.check(submit.arguments) : null;
    if (submit)
      trace.push({ tool: job.submit, input: submit.arguments, error: problem ?? undefined });
    if (submit && !problem) {
      usage.ms = Date.now() - started;
      return { result: job.clean(submit.arguments), usage, trace };
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

/** One Gemini Interactions API call. The job's system prompt and tools are sent every turn. */
async function interact(job: Job<unknown>, input: string | FunctionResult[], previous?: string) {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "x-goog-api-key": Deno.env.get("GEMINI_API_KEY") ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      system_instruction: job.system,
      tools: job.tools,
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
