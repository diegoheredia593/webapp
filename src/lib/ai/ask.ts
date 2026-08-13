import "server-only";
import { createHash } from "crypto";
import { anthropic, TEXT_MODEL } from "@/lib/ai/client";
import { logAIRequest } from "@/lib/ai/logging";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Inspiration } from "@/lib/types";

function hashQuestion(q: string): string {
  return createHash("sha256").update(q.trim().toLowerCase()).digest("hex");
}

// Answers a user question about an inspiration using ONLY the already
// stored structured analysis — no image is re-sent to Claude. Identical
// questions against an unchanged analysis are served from cache instead of
// calling the API again.
export async function askAboutInspiration(
  inspiration: Inspiration,
  question: string
): Promise<{ answer: string; cached: boolean }> {
  const questionHash = hashQuestion(question);

  const { data: cached } = await supabaseAdmin
    .from("dl_ai_qa_cache")
    .select("answer")
    .eq("inspiration_id", inspiration.id)
    .eq("question_hash", questionHash)
    .eq("analysis_version", inspiration.analysis_version)
    .maybeSingle();

  if (cached) return { answer: cached.answer, cached: true };

  const context = JSON.stringify(inspiration.analysis, null, 2);

  const response = await anthropic().messages.create({
    model: TEXT_MODEL,
    max_tokens: 1024,
    system:
      "You are a senior web designer and design educator. Answer the user's question about a previously analyzed website design using ONLY the structured analysis JSON provided as context. Be specific, concise, and practical. If the question requires visual details not present in the analysis, say so plainly rather than guessing.",
    messages: [
      {
        role: "user",
        content: `Stored design analysis:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  await logAIRequest({
    inspirationId: inspiration.id,
    requestType: "question",
    model: TEXT_MODEL,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    cacheKey: questionHash,
  });

  const textBlock = response.content.find((b): b is { type: "text"; text: string } => b.type === "text");
  const answer = textBlock?.text ?? "I couldn't generate an answer.";

  await supabaseAdmin.from("dl_ai_qa_cache").insert({
    inspiration_id: inspiration.id,
    question_hash: questionHash,
    question,
    answer,
    analysis_version: inspiration.analysis_version,
    model: TEXT_MODEL,
  });

  return { answer, cached: false };
}
