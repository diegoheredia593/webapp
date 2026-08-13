import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, VISION_MODEL } from "@/lib/ai/client";
import {
  ANALYST_SYSTEM_PROMPT,
  designAnalysisToolSchema,
  designAnalysisZod,
} from "@/lib/ai/analysisSchema";
import { logAIRequest } from "@/lib/ai/logging";
import type { DesignAnalysis } from "@/lib/types";

export class AnalysisError extends Error {}

// This is the ONE comprehensive Claude Vision request made per new
// inspiration. It returns every field the app needs (summary, design DNA,
// tags, vocabulary, breakdown, why-it-works, recreation notes) in a single
// structured call — never split into several smaller calls.
export async function analyzeScreenshot(params: {
  inspirationId: string;
  base64Image: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  contextHint?: string; // e.g. a URL or title the user provided
}): Promise<DesignAnalysis> {
  const userText = params.contextHint
    ? `Analyze this website screenshot. Context provided by the user: ${params.contextHint}`
    : "Analyze this website screenshot.";

  let response;
  try {
    response = await anthropic().messages.create({
      model: VISION_MODEL,
      max_tokens: 4096,
      system: ANALYST_SYSTEM_PROMPT,
      tools: [designAnalysisToolSchema],
      tool_choice: { type: "tool", name: designAnalysisToolSchema.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: params.mediaType,
                data: params.base64Image,
              },
            },
            { type: "text", text: userText },
          ],
        },
      ],
    });
  } catch (err: any) {
    await logAIRequest({
      inspirationId: params.inspirationId,
      requestType: "vision_analysis",
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
    requestType: "vision_analysis",
    model: VISION_MODEL,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    throw new AnalysisError("Claude did not return a structured analysis.");
  }

  const parsed = designAnalysisZod.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new AnalysisError(
      `Claude's analysis failed schema validation: ${parsed.error.message}`
    );
  }

  return parsed.data;
}
