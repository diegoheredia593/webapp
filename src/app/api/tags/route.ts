import { NextResponse } from "next/server";
import { listTags } from "@/lib/db/tags";

export const runtime = "nodejs";

export async function GET() {
  const tags = await listTags();
  return NextResponse.json({ tags });
}
