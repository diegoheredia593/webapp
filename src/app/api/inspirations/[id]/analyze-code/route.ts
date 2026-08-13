import { NextRequest, NextResponse } from "next/server";
import { runCodeAnalysis } from "@/lib/ai/runCodeAnalysis";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await runCodeAnalysis(id);
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err?.message === "Inspiration not found" ? 404 : 400;
    return NextResponse.json({ error: err?.message ?? "Analysis failed" }, { status });
  }
}
