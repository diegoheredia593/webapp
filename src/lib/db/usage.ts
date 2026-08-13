import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AIUsageSummary } from "@/lib/types";
import { getBudgetStatus } from "@/lib/ai/budget";

export async function getUsageSummary(): Promise<AIUsageSummary> {
  const { data, error } = await supabaseAdmin
    .from("dl_ai_requests")
    .select("request_type, model, input_tokens, output_tokens, estimated_cost_usd");
  if (error) throw error;

  const rows = data ?? [];
  const images_analyzed = rows.filter((r) => r.request_type === "vision_analysis").length;
  const ai_requests = rows.length;
  const input_tokens = rows.reduce((s, r) => s + (r.input_tokens ?? 0), 0);
  const output_tokens = rows.reduce((s, r) => s + (r.output_tokens ?? 0), 0);
  const estimated_cost_usd = rows.reduce((s, r) => s + Number(r.estimated_cost_usd ?? 0), 0);

  const byModel = new Map<string, { requests: number; cost_usd: number }>();
  const byType = new Map<string, { requests: number; cost_usd: number }>();
  for (const r of rows) {
    const m = byModel.get(r.model) ?? { requests: 0, cost_usd: 0 };
    m.requests += 1;
    m.cost_usd += Number(r.estimated_cost_usd ?? 0);
    byModel.set(r.model, m);

    const t = byType.get(r.request_type) ?? { requests: 0, cost_usd: 0 };
    t.requests += 1;
    t.cost_usd += Number(r.estimated_cost_usd ?? 0);
    byType.set(r.request_type, t);
  }

  const budget = await getBudgetStatus();

  return {
    images_analyzed,
    ai_requests,
    input_tokens,
    output_tokens,
    estimated_cost_usd: Math.round(estimated_cost_usd * 100) / 100,
    monthly_budget_usd: budget.monthlyBudgetUsd,
    budget_used_pct: Math.round(budget.usedPct * 10) / 10,
    by_model: Array.from(byModel.entries()).map(([model, v]) => ({ model, ...v })),
    by_type: Array.from(byType.entries()).map(([request_type, v]) => ({ request_type, ...v })),
  };
}
