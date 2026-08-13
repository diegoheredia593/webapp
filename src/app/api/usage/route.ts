import { NextResponse } from "next/server";
import { getUsageSummary } from "@/lib/db/usage";

export const runtime = "nodejs";

export async function GET() {
  const usage = await getUsageSummary();
  return NextResponse.json({ usage });
}
