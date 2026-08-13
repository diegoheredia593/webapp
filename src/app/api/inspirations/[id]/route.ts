import { NextRequest, NextResponse } from "next/server";
import {
  deleteInspiration,
  getInspirationById,
  setInspirationCollections,
  updateInspirationFields,
} from "@/lib/db/inspirations";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inspiration = await getInspirationById(id);
  if (!inspiration) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ inspiration });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { collectionIds, ...fields } = body ?? {};

  if (Array.isArray(collectionIds)) {
    await setInspirationCollections(id, collectionIds);
  }

  const allowedFields = ["title", "notes", "source_url", "is_favorite"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in fields) patch[key] = fields[key];
  }

  const inspiration = Object.keys(patch).length
    ? await updateInspirationFields(id, patch as any)
    : await getInspirationById(id);

  return NextResponse.json({ inspiration });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteInspiration(id);
  return NextResponse.json({ ok: true });
}
