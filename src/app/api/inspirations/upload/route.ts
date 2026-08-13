import { NextRequest, NextResponse } from "next/server";
import { sha256, makeAiOptimizedImage } from "@/lib/images/process";
import { uploadToStorage } from "@/lib/images/storage";
import { createInspiration, findInspirationByHash } from "@/lib/db/inspirations";
import type { SourceType } from "@/lib/types";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const title = (form.get("title") as string | null) ?? null;
  const sourceUrl = (form.get("sourceUrl") as string | null) ?? null;
  const notes = (form.get("notes") as string | null) ?? null;
  const sourceType = ((form.get("sourceType") as string | null) ?? "screenshot") as SourceType;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPG, PNG, or WebP." },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const hash = sha256(buffer);

  // Duplicate protection: if this exact image was already analyzed, reuse
  // it instead of storing a second copy or calling Claude again.
  const existing = await findInspirationByHash(hash);
  if (existing) {
    return NextResponse.json({ inspiration: existing, deduped: true });
  }

  const ext = file.type.split("/")[1];
  const [originalUrl, optimized] = await Promise.all([
    uploadToStorage({
      path: `${hash}/original.${ext}`,
      data: buffer,
      contentType: file.type,
    }),
    makeAiOptimizedImage(buffer),
  ]);

  const optimizedUrl = await uploadToStorage({
    path: `${hash}/optimized.jpg`,
    data: optimized.data,
    contentType: optimized.mediaType,
  });

  const inspiration = await createInspiration({
    title,
    sourceUrl,
    notes,
    sourceType,
    originalImagePath: originalUrl,
    optimizedImagePath: optimizedUrl,
    imageHash: hash,
    status: "uploaded",
  });

  return NextResponse.json({ inspiration, deduped: false });
}
