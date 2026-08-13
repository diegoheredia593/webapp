import { NextRequest, NextResponse } from "next/server";
import { getInspirationById } from "@/lib/db/inspirations";
import { askAboutInspiration } from "@/lib/ai/ask";
import { assertBudgetAllows } from "@/lib/ai/budget";

export const runtime = "nodejs";
export const maxDuration = 60;

// Only triggered when the user explicitly asks a question — uses the
// already-stored structured analysis, not the original image.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { question, override } = await req.json();
  if (!question || typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const inspiration = await getInspirationById(id);
  if (!inspiration) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!inspiration.analysis) {
    return NextResponse.json(
      { error: "This inspiration hasn't been analyzed yet." },
      { status: 400 }
    );
  }

  const { allowed, status } = await assertBudgetAllows({ essential: false, override: Boolean(override) });
  if (!allowed) {
    return NextResponse.json(
      { error: "Monthly AI budget exceeded.", budget: status },
      { status: 402 }
    );
  }

  const result = await askAboutInspiration(inspiration, question);
  return NextResponse.json(result);
}
