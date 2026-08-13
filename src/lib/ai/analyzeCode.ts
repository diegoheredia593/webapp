import "server-only";
import { anthropic, VISION_MODEL } from "@/lib/ai/client";
import { designAnalysisToolSchema, designAnalysisZod } from "@/lib/ai/analysisSchema";
import { logAIRequest } from "@/lib/ai/logging";
import { AnalysisError } from "@/lib/ai/analyzeImage";
import type { DesignAnalysis } from "@/lib/types";

const CODE_SYSTEM_PROMPT = `You are a senior frontend engineer and design educator reviewing submitted frontend code (HTML/CSS/JS/React/Tailwind/etc.) for a personal design-knowledge library. Analyze it like a detailed design + code critique, not a linter.

Map your findings onto the record_design_analysis tool fields:
- summary: what this code builds and its overall approach.
- design_dna: short phrases capturing its visual/architectural identity.
- style_tags / industry_tags / layout_patterns / typography: infer from the rendered result where evident from markup, classes, and CSS.
- components: concrete UI components implemented (Hero, Navbar, Pricing, etc.).
- design_vocabulary: professional terms this code demonstrates (e.g. "CSS Grid template areas", "container queries", "compound component pattern"), each with explanation + how it appears in this code.
- design_principles / why_it_works: what makes the implementation effective.
- recreation_notes: use this field for concrete implementation notes — CSS techniques used, responsive strategy, animation approach, and potential improvements or refactors.
- design_breakdown: break the code into sections such as "Layout Architecture", "CSS Techniques", "Components", "Responsive Behavior", "Animations", "Reusability" — each with specific observations grounded in the actual code.

Call record_design_analysis exactly once with the complete analysis.`;

export async function analyzeCode(params: {
  inspirationId: string;
  code: string;
  language?: string | null;
  contextHint?: string | null;
}): Promise<DesignAnalysis> {
  const userText = `${params.contextHint ? `Context: ${params.contextHint}\n\n` : ""}Language: ${
    params.language ?? "unspecified"
  }\n\n\`\`\`\n${params.code.slice(0, 60000)}\n\`\`\``;

  let response;
  try {
    response = await anthropic().messages.create({
      model: VISION_MODEL,
      max_tokens: 4096,
      system: CODE_SYSTEM_PROMPT,
      tools: [designAnalysisToolSchema],
      tool_choice: { type: "tool", name: designAnalysisToolSchema.name },
      messages: [{ role: "user", content: userText }],
    });
  } catch (err: any) {
    await logAIRequest({
      inspirationId: params.inspirationId,
      requestType: "code_analysis",
      model: VISION_MODEL,
      inputTokens: 0,
      outputTokens: 0,
      status: "error",
      errorMessage: err?.message ?? String(err),
    });
    throw new AnalysisError(`Claude request failed: ${err?.message ?? err}`);
  }

  await logAIRequest({
    inspirationId: params.inspirationId,
    requestType: "code_analysis",
    model: VISION_MODEL,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
  });

  const toolUse = response.content.find((b): b is any => b.type === "tool_use");
  if (!toolUse) throw new AnalysisError("Claude did not return a structured analysis.");

  const parsed = designAnalysisZod.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new AnalysisError(`Claude's analysis failed schema validation: ${parsed.error.message}`);
  }
  return parsed.data;
}
