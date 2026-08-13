import "server-only";

// Pricing is configurable per-model so it can be updated without touching
// call sites when Anthropic changes prices or new models are introduced.
// Prices are USD per 1M tokens (input / output).
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-1-20250805": { input: 15, output: 75 },
  "claude-opus-4-5-20251101": { input: 5, output: 25 },
  "claude-sonnet-4-5-20250929": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
};

const DEFAULT_PRICING = { input: 3, output: 15 };

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model] ?? DEFAULT_PRICING;
  const cost =
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output;
  return Math.round(cost * 100000) / 100000;
}
