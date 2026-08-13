"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import type { Collection } from "@/lib/types";

const SUGGESTED = [
  "Hero Inspiration",
  "Typography",
  "Landing Pages",
  "SaaS",
  "Luxury",
  "Minimal",
  "Dark Websites",
  "Animations",
  "Navigation",
  "Portfolio",
  "Creative Agencies",
];

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  function refresh() {
    api.listCollections().then((r) => setCollections(r.collections));
  }

  useEffect(refresh, []);

  async function createCollection(collectionName: string) {
    if (!collectionName.trim()) return;
    setCreating(true);
    try {
      await api.createCollection(collectionName.trim());
      setName("");
      refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="pt-8">
      <h1 className="font-serif text-3xl tracking-tight mb-6">Collections</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createCollection(name);
        }}
        className="flex gap-3 mb-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New collection name…"
          className="flex-1 bg-white border border-line rounded-full px-4 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          disabled={creating}
          className="text-sm border border-ink px-5 py-2 rounded-full hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
        >
          Create
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-10">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            onClick={() => createCollection(s)}
            className="text-xs px-3 py-1.5 rounded-full border border-line text-muted hover:border-ink hover:text-ink transition-colors"
          >
            + {s}
          </button>
        ))}
      </div>

      {collections === null && <p className="text-muted text-sm">Loading…</p>}

      {collections && collections.length === 0 && (
        <div className="border border-dashed border-line rounded-lg py-24 text-center text-muted">
          Create a collection to start organizing your library.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections?.map((c) => (
          <Link
            key={c.id}
            href={`/collections/${c.id}`}
            className="border border-line rounded-lg p-5 hover:border-ink transition-colors bg-white"
          >
            <h3 className="font-medium mb-1">{c.name}</h3>
            <p className="text-sm text-muted">{c.inspiration_count ?? 0} inspirations</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
