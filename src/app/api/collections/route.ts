import { NextRequest, NextResponse } from "next/server";
import { createCollection, listCollections } from "@/lib/db/collections";

export const runtime = "nodejs";

export async function GET() {
  const collections = await listCollections();
  return NextResponse.json({ collections });
}

export async function POST(req: NextRequest) {
  const { name, description } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  const collection = await createCollection(name.trim(), description);
  return NextResponse.json({ collection });
}
