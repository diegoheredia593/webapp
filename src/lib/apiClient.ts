import type { Collection, Inspiration, Tag, AIUsageSummary } from "@/lib/types";

async function j<T>(resPromise: Promise<Response>): Promise<T> {
  const res = await resPromise;
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  listInspirations: (params: Record<string, string> = {}) =>
    j<{ inspirations: Inspiration[] }>(
      fetch(`/api/inspirations?${new URLSearchParams(params).toString()}`)
    ),
  getInspiration: (id: string) => j<{ inspiration: Inspiration }>(fetch(`/api/inspirations/${id}`)),
  patchInspiration: (id: string, patch: Record<string, unknown>) =>
    j<{ inspiration: Inspiration }>(
      fetch(`/api/inspirations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
    ),
  deleteInspiration: (id: string) => j<{ ok: true }>(fetch(`/api/inspirations/${id}`, { method: "DELETE" })),
  analyze: (id: string) => j<{ inspiration: Inspiration; error?: string }>(fetch(`/api/inspirations/${id}/analyze`, { method: "POST" })),
  analyzeCode: (id: string) => j<{ inspiration: Inspiration; error?: string }>(fetch(`/api/inspirations/${id}/analyze-code`, { method: "POST" })),
  retry: (id: string) => j<{ inspiration: Inspiration; error?: string }>(fetch(`/api/inspirations/${id}/retry`, { method: "POST" })),
  ask: (id: string, question: string, override = false) =>
    j<{ answer: string; cached: boolean }>(
      fetch(`/api/inspirations/${id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, override }),
      })
    ),
  uploadScreenshot: (form: FormData) =>
    j<{ inspiration: Inspiration; deduped: boolean }>(fetch(`/api/inspirations/upload`, { method: "POST", body: form })),
  createManual: (payload: Record<string, unknown>) =>
    j<{ inspiration: Inspiration }>(
      fetch(`/api/inspirations/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    ),
  createCode: (payload: Record<string, unknown>) =>
    j<{ inspiration: Inspiration }>(
      fetch(`/api/inspirations/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    ),
  compare: (ids: string[], override = false) =>
    j<{ comparison: string }>(
      fetch(`/api/inspirations/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, override }),
      })
    ),
  listCollections: () => j<{ collections: Collection[] }>(fetch(`/api/collections`)),
  createCollection: (name: string, description?: string) =>
    j<{ collection: Collection }>(
      fetch(`/api/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })
    ),
  deleteCollection: (id: string) => j<{ ok: true }>(fetch(`/api/collections/${id}`, { method: "DELETE" })),
  listTags: () => j<{ tags: Tag[] }>(fetch(`/api/tags`)),
  usage: () => j<{ usage: AIUsageSummary }>(fetch(`/api/usage`)),
};
