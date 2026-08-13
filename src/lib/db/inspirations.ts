import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  AnalysisStatus,
  DesignAnalysis,
  Inspiration,
  SourceType,
} from "@/lib/types";
import { buildSearchText } from "@/lib/db/searchText";
import { syncTagsFromAnalysis } from "@/lib/db/tags";

const BASE_SELECT = `
  *,
  dl_inspiration_tags ( dl_tags ( id, name, category ) ),
  dl_inspiration_collections ( dl_collections ( id, name, description ) )
`;

function mapRow(row: any): Inspiration {
  const { dl_inspiration_tags, dl_inspiration_collections, search_text, search_vector, ...rest } = row;
  return {
    ...rest,
    tags: (dl_inspiration_tags ?? []).map((r: any) => r.dl_tags).filter(Boolean),
    collections: (dl_inspiration_collections ?? []).map((r: any) => r.dl_collections).filter(Boolean),
  };
}

export async function findInspirationByHash(hash: string): Promise<Inspiration | null> {
  const { data, error } = await supabaseAdmin
    .from("dl_inspirations")
    .select(BASE_SELECT)
    .eq("image_hash", hash)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function createInspiration(params: {
  title?: string | null;
  sourceUrl?: string | null;
  sourceType: SourceType;
  originalImagePath?: string | null;
  optimizedImagePath?: string | null;
  imageHash?: string | null;
  codeLanguage?: string | null;
  codeContent?: string | null;
  notes?: string | null;
  status: AnalysisStatus;
}): Promise<Inspiration> {
  const { data, error } = await supabaseAdmin
    .from("dl_inspirations")
    .insert({
      title: params.title ?? null,
      source_url: params.sourceUrl ?? null,
      source_type: params.sourceType,
      original_image_path: params.originalImagePath ?? null,
      optimized_image_path: params.optimizedImagePath ?? null,
      image_hash: params.imageHash ?? null,
      code_language: params.codeLanguage ?? null,
      code_content: params.codeContent ?? null,
      notes: params.notes ?? null,
      analysis_status: params.status,
      search_text: buildSearchText({
        title: params.title,
        sourceUrl: params.sourceUrl,
        notes: params.notes,
        codeContent: params.codeContent,
      }),
    })
    .select(BASE_SELECT)
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function getInspirationById(id: string): Promise<Inspiration | null> {
  const { data, error } = await supabaseAdmin
    .from("dl_inspirations")
    .select(BASE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data) : null;
}

export async function setAnalyzing(id: string) {
  await supabaseAdmin
    .from("dl_inspirations")
    .update({ analysis_status: "analyzing", analysis_error: null })
    .eq("id", id);
}

// Persists the one Claude analysis result permanently. Also syncs tags and
// rebuilds the search text (keyword search + embedding input) — all
// non-AI, local operations.
export async function saveAnalysisResult(params: {
  id: string;
  analysis: DesignAnalysis;
}): Promise<Inspiration> {
  const existing = await getInspirationById(params.id);
  if (!existing) throw new Error("Inspiration not found");

  const title = existing.title ?? deriveTitleFromAnalysis(params.analysis);

  const search_text = buildSearchText({
    title,
    sourceUrl: existing.source_url,
    notes: existing.notes,
    codeContent: existing.code_content,
    analysis: params.analysis,
  });

  const { data, error } = await supabaseAdmin
    .from("dl_inspirations")
    .update({
      analysis: params.analysis,
      analysis_status: "completed",
      analysis_error: null,
      title,
      search_text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select(BASE_SELECT)
    .single();
  if (error) throw error;

  await syncTagsFromAnalysis(params.id, params.analysis);

  return mapRow(data);
}

function deriveTitleFromAnalysis(analysis: DesignAnalysis): string {
  return analysis.design_dna.slice(0, 3).join(" · ") || "Untitled inspiration";
}

export async function markAnalysisFailed(id: string, errorMessage: string) {
  const current = await getInspirationById(id);
  const retryCount = (current?.retry_count ?? 0) + 1;
  await supabaseAdmin
    .from("dl_inspirations")
    .update({
      analysis_status: retryCount >= 3 ? "failed" : "needs_retry",
      analysis_error: errorMessage,
      retry_count: retryCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export interface ListFilters {
  q?: string;
  favoritesOnly?: boolean;
  collectionId?: string;
  tagId?: string;
  status?: AnalysisStatus;
  limit?: number;
  offset?: number;
}

export async function listInspirations(filters: ListFilters = {}): Promise<Inspiration[]> {
  let query = supabaseAdmin.from("dl_inspirations").select(BASE_SELECT);

  if (filters.favoritesOnly) query = query.eq("is_favorite", true);
  if (filters.status) query = query.eq("analysis_status", filters.status);
  if (filters.q && filters.q.trim()) {
    query = query.textSearch("search_vector", toWebsearchQuery(filters.q), {
      type: "websearch",
      config: "english",
    });
  }

  query = query
    .order("created_at", { ascending: false })
    .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 60) - 1);

  const { data, error } = await query;
  if (error) throw error;
  let rows = (data ?? []).map(mapRow);

  if (filters.collectionId) {
    rows = rows.filter((r) => r.collections?.some((c) => c.id === filters.collectionId));
  }
  if (filters.tagId) {
    rows = rows.filter((r) => r.tags?.some((t) => t.id === filters.tagId));
  }

  return rows;
}

function toWebsearchQuery(q: string): string {
  return q.trim();
}

export async function updateInspirationFields(
  id: string,
  fields: Partial<{
    title: string;
    notes: string;
    source_url: string;
    is_favorite: boolean;
  }>
): Promise<Inspiration> {
  const existing = await getInspirationById(id);
  if (!existing) throw new Error("Inspiration not found");

  const merged = { ...existing, ...fields };
  const search_text = buildSearchText({
    title: merged.title,
    sourceUrl: merged.source_url,
    notes: merged.notes,
    codeContent: merged.code_content,
    analysis: merged.analysis,
  });

  const { data, error } = await supabaseAdmin
    .from("dl_inspirations")
    .update({ ...fields, search_text, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(BASE_SELECT)
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteInspiration(id: string) {
  const { error } = await supabaseAdmin.from("dl_inspirations").delete().eq("id", id);
  if (error) throw error;
}

export async function setInspirationCollections(id: string, collectionIds: string[]) {
  await supabaseAdmin.from("dl_inspiration_collections").delete().eq("inspiration_id", id);
  if (collectionIds.length === 0) return;
  await supabaseAdmin.from("dl_inspiration_collections").insert(
    collectionIds.map((collection_id) => ({ inspiration_id: id, collection_id }))
  );
}
