import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { DesignAnalysis, TagCategory } from "@/lib/types";

const CATEGORY_FIELD_MAP: { field: keyof DesignAnalysis; category: TagCategory }[] = [
  { field: "style_tags", category: "style" },
  { field: "industry_tags", category: "industry" },
  { field: "layout_patterns", category: "layout" },
  { field: "typography", category: "typography" },
  { field: "components", category: "component" },
];

// Tags come entirely from the single Claude analysis response — no
// additional AI calls are made to "categorize" an inspiration.
export async function syncTagsFromAnalysis(
  inspirationId: string,
  analysis: DesignAnalysis
) {
  const wanted: { name: string; category: TagCategory }[] = [];
  for (const { field, category } of CATEGORY_FIELD_MAP) {
    const values = analysis[field] as unknown as string[];
    for (const raw of values ?? []) {
      const name = raw.trim();
      if (name) wanted.push({ name, category });
    }
  }

  if (wanted.length === 0) return;

  const tagIds: string[] = [];
  for (const tag of wanted) {
    const { data: existing } = await supabaseAdmin
      .from("dl_tags")
      .select("id")
      .eq("name", tag.name)
      .eq("category", tag.category)
      .maybeSingle();

    if (existing) {
      tagIds.push(existing.id);
      continue;
    }

    const { data: created, error } = await supabaseAdmin
      .from("dl_tags")
      .insert({ name: tag.name, category: tag.category })
      .select("id")
      .single();
    if (error) throw error;
    tagIds.push(created.id);
  }

  await supabaseAdmin
    .from("dl_inspiration_tags")
    .delete()
    .eq("inspiration_id", inspirationId);

  await supabaseAdmin.from("dl_inspiration_tags").insert(
    tagIds.map((tag_id) => ({ inspiration_id: inspirationId, tag_id }))
  );
}

export async function listTags() {
  const { data, error } = await supabaseAdmin
    .from("dl_tags")
    .select("id, name, category")
    .order("category")
    .order("name");
  if (error) throw error;
  return data;
}
