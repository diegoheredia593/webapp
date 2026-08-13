import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logAIRequest } from "@/lib/ai/logging";

export const EMBEDDINGS_ENABLED = Boolean(process.env.VOYAGE_API_KEY);
const EMBEDDING_MODEL = process.env.VOYAGE_EMBEDDING_MODEL ?? "voyage-3.5-lite";

// Semantic search is entirely optional — Anthropic doesn't offer an
// embeddings endpoint, so this uses Voyage AI (Anthropic's recommended
// embeddings partner) only when VOYAGE_API_KEY is configured. Without it,
// the app transparently falls back to Postgres full-text keyword search;
// nothing else breaks. Generated exactly once per inspiration, right after
// analysis is saved — never regenerated on search.
export async function generateAndStoreEmbedding(params: {
  inspirationId: string;
  searchText: string;
}) {
  if (!EMBEDDINGS_ENABLED) return;

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [params.searchText.slice(0, 8000)],
      model: EMBEDDING_MODEL,
      input_type: "document",
      output_dimension: 1024,
    }),
  });

  if (!res.ok) {
    await logAIRequest({
      inspirationId: params.inspirationId,
      requestType: "embedding",
      model: EMBEDDING_MODEL,
      inputTokens: 0,
      outputTokens: 0,
      status: "error",
      errorMessage: `Voyage embedding request failed: ${res.status}`,
    });
    return;
  }

  const json = await res.json();
  const embedding: number[] = json.data?.[0]?.embedding;
  const totalTokens: number = json.usage?.total_tokens ?? 0;
  if (!embedding) return;

  await supabaseAdmin.from("dl_embeddings").upsert({
    inspiration_id: params.inspirationId,
    embedding,
    embedding_version: 1,
    search_text: params.searchText,
    updated_at: new Date().toISOString(),
  });

  await logAIRequest({
    inspirationId: params.inspirationId,
    requestType: "embedding",
    model: EMBEDDING_MODEL,
    inputTokens: totalTokens,
    outputTokens: 0,
  });
}

export async function semanticSearch(query: string, limit = 30): Promise<string[]> {
  if (!EMBEDDINGS_ENABLED) return [];

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: [query],
      model: EMBEDDING_MODEL,
      input_type: "query",
      output_dimension: 1024,
    }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  const embedding: number[] = json.data?.[0]?.embedding;
  if (!embedding) return [];

  // Query-time embedding lookup only — never a Claude call. This is a
  // plain nearest-neighbor read against pgvector.
  const { data, error } = await supabaseAdmin.rpc("dl_match_embeddings", {
    query_embedding: embedding,
    match_count: limit,
  });
  if (error || !data) return [];
  return data.map((r: any) => r.inspiration_id);
}
