// Shared types for the design inspiration library.
// Mirrors the `dl_*` tables in Supabase — see the migration applied via MCP.

export type SourceType = "screenshot" | "url" | "image" | "code" | "manual";

export type AnalysisStatus =
  | "uploaded"
  | "analyzing"
  | "completed"
  | "failed"
  | "needs_retry";

export type TagCategory =
  | "style"
  | "layout"
  | "typography"
  | "industry"
  | "component"
  | "other";

export interface VocabularyTerm {
  term: string;
  explanation: string;
  application: string;
}

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface DesignBreakdownSection {
  section: string; // e.g. "Navigation", "Hero", "Typography", "Images"
  observations: string[];
}

// The single structured payload returned by the one comprehensive Claude
// Vision analysis call. Persisted verbatim as JSONB on dl_inspirations.analysis.
export interface DesignAnalysis {
  summary: string;
  design_dna: string[];
  style_tags: string[];
  industry_tags: string[];
  layout_patterns: string[];
  typography: string[];
  components: string[];
  design_vocabulary: VocabularyTerm[];
  color_palette: ColorSwatch[];
  design_principles: string[];
  why_it_works: string[];
  recreation_notes: string[];
  design_breakdown: DesignBreakdownSection[];
}

export interface Inspiration {
  id: string;
  title: string | null;
  source_url: string | null;
  source_type: SourceType;
  original_image_path: string | null;
  optimized_image_path: string | null;
  image_hash: string | null;
  code_language: string | null;
  code_content: string | null;
  notes: string | null;
  analysis: DesignAnalysis | null;
  analysis_version: number;
  analysis_status: AnalysisStatus;
  analysis_error: string | null;
  retry_count: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  collections?: Collection[];
}

export interface Tag {
  id: string;
  name: string;
  category: TagCategory;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  inspiration_count?: number;
}

export type AIRequestType =
  | "vision_analysis"
  | "code_analysis"
  | "question"
  | "comparison"
  | "tag_refinement"
  | "embedding";

export interface AIUsageSummary {
  images_analyzed: number;
  ai_requests: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  monthly_budget_usd: number;
  budget_used_pct: number;
  by_model: { model: string; requests: number; cost_usd: number }[];
  by_type: { request_type: string; requests: number; cost_usd: number }[];
}
