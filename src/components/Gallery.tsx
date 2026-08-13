"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/apiClient";
import type { Inspiration, Tag } from "@/lib/types";
import InspirationCard from "@/components/InspirationCard";

export default function Gallery({
  favoritesOnly,
  collectionId,
  title,
  emptyHint,
}: {
  favoritesOnly?: boolean;
  collectionId?: string;
  title?: string;
  emptyHint?: string;
}) {
  const [items, setItems] = useState<Inspiration[] | null>(null);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [view, setView] = useState<"grid" | "compact">("grid");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listTags().then((r) => setTags(r.tags)).catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string> = {};
      if (query.trim()) params.q = query.trim();
      if (favoritesOnly) params.favorites = "true";
      if (collectionId) params.collection = collectionId;
      if (tagFilter) params.tag = tagFilter;
      api
        .listInspirations(params)
        .then((r) => setItems(r.inspirations))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(handle);
  }, [query, favoritesOnly, collectionId, tagFilter]);

  // Poll while anything is still analyzing so the gallery updates itself
  // without the user refreshing — no extra Claude calls, just DB reads.
  useEffect(() => {
    const hasPending = items?.some(
      (i) => i.analysis_status === "analyzing" || i.analysis_status === "uploaded"
    );
    if (!hasPending) return;
    const interval = setInterval(() => {
      const params: Record<string, string> = {};
      if (query.trim()) params.q = query.trim();
      if (favoritesOnly) params.favorites = "true";
      if (collectionId) params.collection = collectionId;
      if (tagFilter) params.tag = tagFilter;
      api.listInspirations(params).then((r) => setItems(r.inspirations));
    }, 4000);
    return () => clearInterval(interval);
  }, [items, query, favoritesOnly, collectionId, tagFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Tag[]>();
    for (const t of tags) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return map;
  }, [tags]);

  async function toggleFavorite(id: string, next: boolean) {
    setItems((prev) => prev?.map((i) => (i.id === id ? { ...i, is_favorite: next } : i)) ?? prev);
    await api.patchInspiration(id, { is_favorite: next });
  }

  return (
    <div className="pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="font-serif text-3xl tracking-tight">{title ?? "Library"}</h1>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search designs, vocabulary, tags…"
            className="w-64 max-w-full bg-white border border-line rounded-full px-4 py-2 text-sm outline-none focus:border-ink transition-colors"
          />
          <div className="flex border border-line rounded-full overflow-hidden text-xs">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-2 ${view === "grid" ? "bg-ink text-paper" : "text-muted"}`}
            >
              Grid
            </button>
            <button
              onClick={() => setView("compact")}
              className={`px-3 py-2 ${view === "compact" ? "bg-ink text-paper" : "text-muted"}`}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 -mt-2">
          <button
            onClick={() => setTagFilter("")}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              tagFilter === "" ? "border-ink bg-ink text-paper" : "border-line text-muted hover:border-ink"
            }`}
          >
            All
          </button>
          {Array.from(grouped.entries()).map(([category, list]) => (
            <span key={category} className="flex flex-wrap gap-2">
              {list.slice(0, 8).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTagFilter(t.id === tagFilter ? "" : t.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    tagFilter === t.id
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-muted hover:border-ink"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </span>
          ))}
        </div>
      )}

      {items === null && (
        <p className="text-muted text-sm">Loading…</p>
      )}

      {items !== null && items.length === 0 && (
        <div className="border border-dashed border-line rounded-lg py-24 text-center text-muted">
          <p>{emptyHint ?? "Nothing here yet."}</p>
        </div>
      )}

      {items && items.length > 0 && (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10"
              : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-5 gap-y-8"
          }
        >
          {items.map((item) => (
            <InspirationCard
              key={item.id}
              inspiration={item}
              compact={view === "compact"}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
      {loading && <p className="text-xs text-muted mt-4">Searching…</p>}
    </div>
  );
}
