import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

export interface BudgetStatus {
  monthlyBudgetUsd: number;
  spentUsd: number;
  usedPct: number;
  level: "ok" | "warn50" | "warn75" | "warn90" | "exceeded";
}

function monthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export async function getBudgetStatus(): Promise<BudgetStatus> {
  const monthlyBudgetUsd = Number(process.env.MONTHLY_AI_BUDGET_USD ?? 20);

  const { data, error } = await supabaseAdmin
    .from("dl_ai_requests")
    .select("estimated_cost_usd")
    .gte("created_at", monthStart());

  if (error) throw error;

  const spentUsd = (data ?? []).reduce(
    (sum, row) => sum + Number(row.estimated_cost_usd ?? 0),
    0
  );
  const usedPct = monthlyBudgetUsd > 0 ? (spentUsd / monthlyBudgetUsd) * 100 : 0;

  let level: BudgetStatus["level"] = "ok";
  if (usedPct >= 100) level = "exceeded";
  else if (usedPct >= 90) level = "warn90";
  else if (usedPct >= 75) level = "warn75";
  else if (usedPct >= 50) level = "warn50";

  return { monthlyBudgetUsd, spentUsd, usedPct, level };
}

// Non-essential AI calls (questions, tag refinement, comparisons) should be
// blocked once the budget is exhausted unless the caller explicitly
// overrides. Essential calls (the one analysis a freshly uploaded
// screenshot needs) are still allowed through with override=true so a
// single upload never gets silently stuck — the point is to stop *runaway*
// or repeated spend, not to brick the library.
export async function assertBudgetAllows(opts: {
  essential: boolean;
  override?: boolean;
}): Promise<{ allowed: boolean; status: BudgetStatus } > {
  const status = await getBudgetStatus();
  if (status.level !== "exceeded") return { allowed: true, status };
  if (opts.override) return { allowed: true, status };
  if (opts.essential) return { allowed: true, status };
  return { allowed: false, status };
}
