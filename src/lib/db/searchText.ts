import type { DesignAnalysis } from "@/lib/types";

// Builds the single searchable text representation described in the spec:
// generated once from the structured analysis, used for both keyword
// full-text search (Postgres tsvector) and as embedding input for semantic
// search. Never regenerated on every search — only when analysis changes.
export function buildSearchText(params: {
  title?: string | null;
  sourceUrl?: string | null;
  notes?: string | null;
  codeContent?: string | null;
  analysis?: DesignAnalysis | null;
}): string {
  const parts: string[] = [];
  if (params.title) parts.push(params.title);
  if (params.sourceUrl) parts.push(params.sourceUrl);
  if (params.notes) parts.push(params.notes);

  const a = params.analysis;
  if (a) {
    parts.push(a.summary);
    parts.push(a.design_dna.join(" "));
    parts.push(a.style_tags.join(" "));
    parts.push(a.industry_tags.join(" "));
    parts.push(a.layout_patterns.join(" "));
    parts.push(a.typography.join(" "));
    parts.push(a.components.join(" "));
    parts.push(a.design_principles.join(" "));
    parts.push(a.why_it_works.join(" "));
    parts.push(a.recreation_notes.join(" "));
    parts.push(
      a.design_vocabulary.map((v) => `${v.term} ${v.explanation} ${v.application}`).join(" ")
    );
    parts.push(a.color_palette.map((c) => c.name).join(" "));
    parts.push(a.design_breakdown.map((b) => `${b.section} ${b.observations.join(" ")}`).join(" "));
  }

  if (params.codeContent) parts.push(params.codeContent.slice(0, 4000));

  return parts.filter(Boolean).join("\n");
}
