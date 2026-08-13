"use client";

import Link from "next/link";
import Image from "next/image";
import type { Inspiration } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export default function InspirationCard({
  inspiration,
  compact,
  onToggleFavorite,
}: {
  inspiration: Inspiration;
  compact?: boolean;
  onToggleFavorite?: (id: string, next: boolean) => void;
}) {
  const image = inspiration.optimized_image_path ?? inspiration.original_image_path;

  return (
    <Link
      href={`/inspiration/${inspiration.id}`}
      className="group block fade-in"
    >
      <div
        className={`relative w-full overflow-hidden rounded-md bg-white border border-line ${
          compact ? "aspect-[4/3]" : "aspect-[16/11]"
        }`}
      >
        {image ? (
          <Image
            src={image}
            alt={inspiration.title ?? "Design inspiration"}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-sm bg-line/40">
            {inspiration.source_type === "code" ? "Code" : "No image"}
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <StatusBadge status={inspiration.analysis_status} />
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite?.(inspiration.id, !inspiration.is_favorite);
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-paper/90 border border-line flex items-center justify-center text-sm hover:bg-paper transition-colors"
          aria-label="Toggle favorite"
        >
          {inspiration.is_favorite ? "★" : "☆"}
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] leading-snug font-medium">
            {inspiration.title ?? "Untitled"}
          </h3>
        </div>
        {!compact && inspiration.analysis?.summary && (
          <p className="text-sm text-muted line-clamp-2">{inspiration.analysis.summary}</p>
        )}
        {inspiration.analysis?.design_dna && inspiration.analysis.design_dna.length > 0 && (
          <p className="text-xs text-accent tracking-wide">
            {inspiration.analysis.design_dna.slice(0, compact ? 2 : 4).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
