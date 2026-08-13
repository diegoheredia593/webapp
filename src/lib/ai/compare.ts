import "server-only";
import { anthropic, VISION_MODEL } from "@/lib/ai/client";
import { logAIRequest } from "@/lib/ai/logging";
import type { Inspiration } from "@/lib/types";

// Compare Mode is explicitly user-triggered — never pre-generated. It sends
// only the already-stored structured analyses (title, design DNA, tags,
// vocabulary, principles), not the original screenshots, keeping the
// request small and cheap.
export async function compareInspirations(inspirations: Inspiration[]): Promise<string> {
  const payload = inspirations.map((i) => ({
    title: i.title,
    source_url: i.source_url,
    design_dna: i.analysis?.design_dna,
    style_tags: i.analysis?.style_tags,
    layout_patterns: i.analysis?.layout_patterns,
    typography: i.analysis?.typography,
    color_palette: i.analysis?.color_palette,
    design_principles: i.analysis?.design_principles,
    why_it_works: i.analysis?.why_it_works,
    summary: i.analysis?.summary,
  }));

  const response = await anthropic().messages.create({
    model: VISION_MODEL,
    max_tokens: 2048,
    system:
      "You are a senior art director comparing multiple previously analyzed website designs for a design-inspiration library. Using only the structured metadata provided (no images), identify shared patterns, meaningful differences, typography/layout/CTA/color strategy contrasts, and shared design principles vs. unique characteristics of each. Be specific and comparative, not a list of restated summaries.",
    messages: [
      {
        role: "user",
        content: `Compare these ${payload.length} designs:\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
  });

  await logAIRequest({
    requestType: "comparison",
    model: VISION_MODEL,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
  });

  const textBlock = response.content.find((b): b is { type: "text"; text: string } => b.type === "text");
  return textBlock?.text ?? "Comparison failed to generate.";
}
