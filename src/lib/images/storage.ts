import "server-only";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase/server";

export async function uploadToStorage(params: {
  path: string;
  data: Buffer;
  contentType: string;
}) {
  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(params.path, params.data, {
      contentType: params.contentType,
      upsert: true,
    });
  if (error) throw error;
  return getPublicUrl(params.path);
}

export function getPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
