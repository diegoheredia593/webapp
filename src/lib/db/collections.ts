import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Collection } from "@/lib/types";

export async function listCollections(): Promise<Collection[]> {
  const { data, error } = await supabaseAdmin
    .from("dl_collections")
    .select("id, name, description, created_at, dl_inspiration_collections(count)")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
    inspiration_count: row.dl_inspiration_collections?.[0]?.count ?? 0,
  }));
}

export async function createCollection(name: string, description?: string) {
  const { data, error } = await supabaseAdmin
    .from("dl_collections")
    .insert({ name, description: description ?? null })
    .select("id, name, description, created_at")
    .single();
  if (error) throw error;
  return data as Collection;
}

export async function deleteCollection(id: string) {
  const { error } = await supabaseAdmin.from("dl_collections").delete().eq("id", id);
  if (error) throw error;
}
