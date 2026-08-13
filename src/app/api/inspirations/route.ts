import { NextRequest, NextResponse } from "next/server";
import { listInspirations } from "@/lib/db/inspirations";
import { semanticSearch } from "@/lib/ai/embeddings";
import { getInspirationById } from "@/lib/db/inspirations";

export const runtime = "nodejs";

// Pure database read — searching, filtering, and browsing never call
// Claude. Semantic search (when enabled) is also just a stored-vector
// lookup, not an AI call: the embedding was generated once at analysis
// time.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const favoritesOnly = searchParams.get("favorites") === "true";
  const collectionId = searchParams.get("collection") ?? undefined;
  const tagId = searchParams.get("tag") ?? undefined;

  const keywordResults = await listInspirations({ q, favoritesOnly, collectionId, tagId });

  if (!q) {
    return NextResponse.json({ inspirations: keywordResults });
  }

  const semanticIds = await semanticSearch(q);
  const seen = new Set(keywordResults.map((r) => r.id));
  const extraIds = semanticIds.filter((id) => !seen.has(id));
  const extras = (
    await Promise.all(extraIds.slice(0, 20).map((id) => getInspirationById(id)))
  ).filter((r): r is NonNullable<typeof r> => Boolean(r));

  return NextResponse.json({ inspirations: [...keywordResults, ...extras] });
}
