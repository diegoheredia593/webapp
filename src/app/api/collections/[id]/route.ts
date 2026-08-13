import { NextRequest, NextResponse } from "next/server";
import { deleteCollection } from "@/lib/db/collections";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteCollection(id);
  return NextResponse.json({ ok: true });
}
