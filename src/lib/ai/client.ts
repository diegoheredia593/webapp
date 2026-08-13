import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
    client = new Anthropic({ apiKey });
  }
  return client;
}

// Model routing: the strong vision model handles initial screenshot
// analysis and visual comparison; the cost-efficient model handles
// follow-up questions, tag refinement, and other text-only transforms.
// Both are configurable via env so pricing/capability changes don't require
// code changes.
export const VISION_MODEL =
  process.env.CLAUDE_VISION_MODEL ?? "claude-opus-4-1-20250805";
export const TEXT_MODEL =
  process.env.CLAUDE_TEXT_MODEL ?? "claude-haiku-4-5-20251001";
