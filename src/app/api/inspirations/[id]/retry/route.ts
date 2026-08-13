import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { runScreenshotAnalysis } from "@/lib/ai/runAnalysis";

export const runtime = "nodejs";
export const maxDuration = 120;

// Manual retry resets the retry counter so a user-initiated retry always
// gets one more attempt, even after the automatic 3-retry cap was hit —
// this is the deliberate override, not an infinite loop.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await supabaseAdmin
    .from("dl_inspirations")
    .update({ retry_count: 0, analysis_status: "uploaded", analysis_error: null })
    .eq("id", id);

  try {
    const result = await runScreenshotAnalysis(id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Retry failed" }, { status: 400 });
  }
}
