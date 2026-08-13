import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { estimateCostUsd } from "@/lib/ai/pricing";
import type { AIRequestType } from "@/lib/types";

export async function logAIRequest(params: {
  inspirationId?: string | null;
  requestType: AIRequestType;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheKey?: string | null;
  status?: "success" | "error";
  errorMessage?: string | null;
}) {
  const estimated_cost_usd = estimateCostUsd(
    params.model,
    params.inputTokens,
    params.outputTokens
  );

  await supabaseAdmin.from("dl_ai_requests").insert({
    inspiration_id: params.inspirationId ?? null,
    request_type: params.requestType,
    model: params.model,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    estimated_cost_usd,
    cache_key: params.cacheKey ?? null,
    status: params.status ?? "success",
    error_message: params.errorMessage ?? null,
  });

  return estimated_cost_usd;
}
