import { NextRequest, NextResponse } from "next/server";
import { getInspirationById } from "@/lib/db/inspirations";
import { compareInspirations } from "@/lib/ai/compare";
import { assertBudgetAllows } from "@/lib/ai/budget";

export const runtime = "nodejs";
export const maxDuration = 60;

// Compare Mode is entirely opt-in: only called when the user explicitly
// requests a comparison. Never pre-generated.
export async function POST(req: NextRequest) {
  const { ids, override } = await req.json();
  if (!Array.isArray(ids) || ids.length < 2) {
    return NextResponse.json({ error: "Select at least 2 inspirations to compare." }, { status: 400 });
  }
  if (ids.length > 6) {
    return NextResponse.json({ error: "Compare up to 6 inspirations at a time." }, { status: 400 });
  }

  const { allowed, status } = await assertBudgetAllows({ essential: false, override: Boolean(override) });
  if (!allowed) {
    return NextResponse.json({ error: "Monthly AI budget exceeded.", budget: status }, { status: 402 });
  }

  const inspirations = (await Promise.all(ids.map((id: string) => getInspirationById(id)))).filter(
    (i): i is NonNullable<typeof i> => Boolean(i && i.analysis)
  );

  if (inspirations.length < 2) {
    return NextResponse.json(
      { error: "At least 2 of the selected inspirations must already be analyzed." },
      { status: 400 }
    );
  }

  const comparison = await compareInspirations(inspirations);
  return NextResponse.json({ comparison });
}
