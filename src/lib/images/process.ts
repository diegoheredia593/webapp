import "server-only";
import { createHash } from "crypto";
import sharp from "sharp";

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

// Produces a smaller, compressed JPEG for AI analysis — enough visual
// fidelity for design analysis without paying for a multi-MB 4K upload on
// every Claude request. The original is kept untouched for the user's
// library.
export async function makeAiOptimizedImage(buffer: Buffer): Promise<{
  data: Buffer;
  mediaType: "image/jpeg";
}> {
  const data = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return { data, mediaType: "image/jpeg" };
}

export async function getImageMetadata(buffer: Buffer) {
  const meta = await sharp(buffer).metadata();
  return { width: meta.width, height: meta.height, format: meta.format };
}
