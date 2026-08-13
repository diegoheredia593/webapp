import { NextRequest, NextResponse } from "next/server";
import { createInspiration } from "@/lib/db/inspirations";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Manual entries are pure knowledge the user already has — title, URL,
// notes, tags. No image, no Claude call, ever.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, sourceUrl, notes, tags, sourceType } = body ?? {};

  if (!title && !sourceUrl) {
    return NextResponse.json({ error: "Provide at least a title or URL." }, { status: 400 });
  }

  const inspiration = await createInspiration({
    title: title ?? sourceUrl,
    sourceUrl: sourceUrl ?? null,
    notes: notes ?? null,
    sourceType: sourceType === "url" ? "url" : "manual",
    status: "completed",
  });

  if (Array.isArray(tags) && tags.length) {
    const tagIds: string[] = [];
    for (const raw of tags as string[]) {
      const name = raw.trim();
      if (!name) continue;
      const { data: existingTag } = await supabaseAdmin
        .from("dl_tags")
        .select("id")
        .eq("name", name)
        .eq("category", "other")
        .maybeSingle();
      const tagId =
        existingTag?.id ??
        (
          await supabaseAdmin
            .from("dl_tags")
            .insert({ name, category: "other" })
            .select("id")
            .single()
        ).data?.id;
      if (tagId) tagIds.push(tagId);
    }
    if (tagIds.length) {
      await supabaseAdmin
        .from("dl_inspiration_tags")
        .insert(tagIds.map((tag_id) => ({ inspiration_id: inspiration.id, tag_id })));
    }
  }

  return NextResponse.json({ inspiration });
}
