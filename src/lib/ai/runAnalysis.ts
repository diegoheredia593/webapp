import "server-only";
import {
  getInspirationById,
  markAnalysisFailed,
  saveAnalysisResult,
  setAnalyzing,
} from "@/lib/db/inspirations";
import { analyzeScreenshot, AnalysisError } from "@/lib/ai/analyzeImage";
import { generateAndStoreEmbedding } from "@/lib/ai/embeddings";
import { buildSearchText } from "@/lib/db/searchText";
import type { Inspiration } from "@/lib/types";

const MAX_RETRIES = 3;

export async function runScreenshotAnalysis(
  inspirationId: string
): Promise<{ inspiration: Inspiration; error?: string }> {
  const inspiration = await getInspirationById(inspirationId);
  if (!inspiration) throw new Error("Inspiration not found");

  if (inspiration.analysis_status === "completed") {
    return { inspiration };
  }
  if (!inspiration.optimized_image_path) {
    throw new Error("This inspiration has no image to analyze.");
  }
  if (inspiration.retry_count >= MAX_RETRIES && inspiration.analysis_status === "failed") {
    throw new Error("Maximum automatic retries reached. Manual retry required.");
  }

  await setAnalyzing(inspiration.id);

  try {
    const imgRes = await fetch(inspiration.optimized_image_path);
    if (!imgRes.ok) throw new AnalysisError("Could not load optimized image for analysis.");
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    const analysis = await analyzeScreenshot({
      inspirationId: inspiration.id,
      base64Image: buffer.toString("base64"),
      mediaType: "image/jpeg",
      contextHint:
        [inspiration.title, inspiration.source_url].filter(Boolean).join(" — ") || undefined,
    });

    const updated = await saveAnalysisResult({ id: inspiration.id, analysis });

    const searchText = buildSearchText({
      title: updated.title,
      sourceUrl: updated.source_url,
      notes: updated.notes,
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
