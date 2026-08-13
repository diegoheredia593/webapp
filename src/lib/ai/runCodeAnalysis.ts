import "server-only";
import {
  getInspirationById,
  markAnalysisFailed,
  saveAnalysisResult,
  setAnalyzing,
} from "@/lib/db/inspirations";
import { analyzeCode } from "@/lib/ai/analyzeCode";
import { AnalysisError } from "@/lib/ai/analyzeImage";
import { generateAndStoreEmbedding } from "@/lib/ai/embeddings";
import { buildSearchText } from "@/lib/db/searchText";
import type { Inspiration } from "@/lib/types";

const MAX_RETRIES = 3;

export async function runCodeAnalysis(
  inspirationId: string
): Promise<{ inspiration: Inspiration; error?: string }> {
  const inspiration = await getInspirationById(inspirationId);
  if (!inspiration) throw new Error("Inspiration not found");

  if (inspiration.analysis_status === "completed") return { inspiration };
  if (!inspiration.code_content) throw new Error("This inspiration has no code to analyze.");
  if (inspiration.retry_count >= MAX_RETRIES && inspiration.analysis_status === "failed") {
    throw new Error("Maximum automatic retries reached. Manual retry required.");
  }

  await setAnalyzing(inspiration.id);

  try {
    const analysis = await analyzeCode({
      inspirationId: inspiration.id,
      code: inspiration.code_content,
      language: inspiration.code_language,
      contextHint: [inspiration.title, inspiration.source_url].filter(Boolean).join(" — ") || null,
    });

    const updated = await saveAnalysisResult({ id: inspiration.id, analysis });

    const searchText = buildSearchText({
      title: updated.title,
      sourceUrl: updated.source_url,
      notes: updated.notes,
      codeContent: updated.code_content,
      analysis: updated.analysis,
    });
    await generateAndStoreEmbedding({ inspirationId: updated.id, searchText }).catch(() => {});

    return { inspiration: updated };
  } catch (err: any) {
    const message =
      err instanceof AnalysisError ? err.message : `Unexpected error: ${err?.message ?? err}`;
    await markAnalysisFailed(inspiration.id, message);
    const failed = await getInspirationById(inspiration.id);
    return { inspiration: failed!, error: message };
  }
}
