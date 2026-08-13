import { NextRequest, NextResponse } from "next/server";
import { createInspiration } from "@/lib/db/inspirations";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, language, code, sourceUrl, notes } = body ?? {};

  if (!code || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Code content is required." }, { status: 400 });
  }

  const inspiration = await createInspiration({
    title: title ?? null,
    sourceUrl: sourceUrl ?? null,
    notes: notes ?? null,
    sourceType: "code",
    codeLanguage: language ?? null,
    codeContent: code,
    status: "uploaded",
  });

  return NextResponse.json({ inspiration });
}
