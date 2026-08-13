"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/apiClient";
import type { Collection, Inspiration } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export default function InspirationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [inspiration, setInspiration] = useState<Inspiration | null>(null);
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();

  async function load() {
    try {
      const { inspiration } = await api.getInspiration(id);
      setInspiration(inspiration);
    } catch {
      setNotFound(true);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!inspiration) return;
    if (inspiration.analysis_status !== "analyzing" && inspiration.analysis_status !== "uploaded") return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspiration?.analysis_status]);

  if (notFound) return <p className="pt-16 text-muted">Inspiration not found.</p>;
  if (!inspiration) return <p className="pt-16 text-muted">Loading…</p>;

  const image = inspiration.optimized_image_path ?? inspiration.original_image_path;
  const a = inspiration.analysis;

  async function toggleFavorite() {
    if (!inspiration) return;
    const next = !inspiration.is_favorite;
    setInspiration({ ...inspiration, is_favorite: next });
    await api.patchInspiration(inspiration.id, { is_favorite: next });
  }

  async function retry() {
    if (!inspiration) return;
    setInspiration({ ...inspiration, analysis_status: "analyzing" });
    const isCode = inspiration.source_type === "code";
    const result = isCode ? await api.analyzeCode(inspiration.id) : await api.retry(inspiration.id);
    setInspiration(result.inspiration);
  }

  async function remove() {
    if (!inspiration) return;
    if (!confirm("Delete this inspiration? This cannot be undone.")) return;
    await api.deleteInspiration(inspiration.id);
    router.push("/");
  }

  return (
    <div className="pt-8 pb-20 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-sm text-muted hover:text-ink">
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFavorite}
            className="text-sm border border-line rounded-full px-3 py-1.5 hover:border-ink transition-colors"
          >
            {inspiration.is_favorite ? "★ Favorited" : "☆ Favorite"}
          </button>
          <button
            onClick={remove}
            className="text-sm text-muted hover:text-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {image && (
        <div className="relative w-full rounded-lg overflow-hidden border border-line bg-white mb-6">
          <Image
            src={image}
            alt={inspiration.title ?? "Design inspiration"}
            width={1400}
            height={900}
            className="w-full h-auto"
            priority
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-serif text-3xl tracking-tight">{inspiration.title ?? "Untitled"}</h1>
        <StatusBadge status={inspiration.analysis_status} />
      </div>
      {inspiration.source_url && (
        <a
          href={inspiration.source_url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-accent hover:underline break-all"
        >
          {inspiration.source_url}
        </a>
      )}

      {(inspiration.analysis_status === "failed" || inspiration.analysis_status === "needs_retry") && (
        <div className="mt-4 border border-amber-300 bg-amber-50 rounded-md px-4 py-3 text-sm">
          <p className="mb-2">Analysis {inspiration.analysis_status === "failed" ? "failed" : "needs a retry"}: {inspiration.analysis_error}</p>
          <button onClick={retry} className="underline font-medium">
            Retry analysis
          </button>
        </div>
      )}

      {(inspiration.analysis_status === "analyzing" || inspiration.analysis_status === "uploaded") && (
        <p className="mt-4 text-sm text-muted">Claude is analyzing this design — this page will update automatically.</p>
      )}

      {a && (
        <div className="mt-10 space-y-12">
          <Section title="Summary">
            <p className="text-[17px] leading-relaxed">{a.summary}</p>
          </Section>

          <Section title="Design DNA">
            <div className="flex flex-wrap gap-2">
              {a.design_dna.map((d) => (
                <span key={d} className="text-sm px-3 py-1.5 rounded-full bg-ink text-paper">
                  {d}
                </span>
              ))}
            </div>
          </Section>

          {a.design_vocabulary.length > 0 && (
            <Section title="Design Vocabulary">
              <div className="space-y-5">
                {a.design_vocabulary.map((v) => (
                  <div key={v.term} className="border-l-2 border-line pl-4">
                    <h4 className="font-medium">{v.term}</h4>
                    <p className="text-sm text-muted mt-1">{v.explanation}</p>
                    <p className="text-sm mt-1.5 italic">In this design: {v.application}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {a.design_breakdown.length > 0 && (
            <Section title="Design Breakdown">
              <div className="grid sm:grid-cols-2 gap-6">
                {a.design_breakdown.map((b) => (
                  <div key={b.section}>
                    <h4 className="font-medium mb-2 text-sm uppercase tracking-wide text-muted">
                      {b.section}
                    </h4>
                    <ul className="space-y-1.5 text-sm list-disc list-inside">
                      {b.observations.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {a.why_it_works.length > 0 && (
            <Section title="Why It Works">
              <ul className="space-y-2 list-disc list-inside text-[15px]">
                {a.why_it_works.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Section>
          )}

          {a.recreation_notes.length > 0 && (
            <Section title="How to Recreate It">
              <ul className="space-y-2 list-disc list-inside text-[15px]">
                {a.recreation_notes.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </Section>
          )}

          {a.color_palette.length > 0 && (
            <Section title="Color Palette">
              <div className="flex flex-wrap gap-4">
                {a.color_palette.map((c) => (
                  <div key={c.hex} className="flex flex-col items-center gap-2">
                    <div
                      className="w-14 h-14 rounded-full border border-line"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-xs text-muted">{c.name}</span>
                    <span className="text-xs font-mono text-muted">{c.hex}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {inspiration.tags?.map((t) => (
                <span key={t.id} className="text-xs px-3 py-1.5 rounded-full border border-line text-muted">
                  {t.name}
                </span>
              ))}
              {(!inspiration.tags || inspiration.tags.length === 0) && (
                <span className="text-sm text-muted">No tags yet.</span>
              )}
            </div>
          </Section>

          <AskAI inspiration={inspiration} />
        </div>
      )}

      <CollectionsPicker inspiration={inspiration} onChange={(c) => setInspiration({ ...inspiration, collections: c })} />

      <NotesEditor inspiration={inspiration} onSave={(notes) => setInspiration({ ...inspiration, notes })} />

      {inspiration.code_content && (
        <Section title="Code">
          <pre className="bg-ink text-paper text-xs rounded-md p-4 overflow-x-auto max-h-96">
            <code>{inspiration.code_content}</code>
          </pre>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-xl tracking-tight mb-4">{title}</h2>
      {children}
    </section>
  );
}

function NotesEditor({ inspiration, onSave }: { inspiration: Inspiration; onSave: (n: string) => void }) {
  const [notes, setNotes] = useState(inspiration.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await api.patchInspiration(inspiration.id, { notes });
    onSave(notes);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Section title="Personal Notes">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        className="w-full bg-white border border-line rounded-md px-3.5 py-2.5 text-sm outline-none focus:border-ink transition-colors"
        placeholder="Why did you save this? What do you want to remember?"
      />
      <button
        onClick={save}
        disabled={saving}
        className="mt-2 text-sm border border-line rounded-full px-4 py-1.5 hover:border-ink transition-colors disabled:opacity-50"
      >
        {saved ? "Saved" : saving ? "Saving…" : "Save notes"}
      </button>
    </Section>
  );
}

function CollectionsPicker({
  inspiration,
  onChange,
}: {
  inspiration: Inspiration;
  onChange: (c: Collection[]) => void;
}) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set((inspiration.collections ?? []).map((c) => c.id))
  );

  useEffect(() => {
    api.listCollections().then((r) => setCollections(r.collections));
  }, []);

  async function toggle(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    const { inspiration: updated } = await api.patchInspiration(inspiration.id, {
      collectionIds: Array.from(next),
    });
    onChange(updated.collections ?? []);
  }

  if (collections.length === 0) return null;

  return (
    <Section title="Collections">
      <div className="flex flex-wrap gap-2">
        {collections.map((c) => (
          <button
            key={c.id}
            onClick={() => toggle(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              selected.has(c.id) ? "border-ink bg-ink text-paper" : "border-line text-muted hover:border-ink"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </Section>
  );
}

function AskAI({ inspiration }: { inspiration: Inspiration }) {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<{ q: string; a: string; cached: boolean }[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setError(null);
    try {
      const result = await api.ask(inspiration.id, question);
      setAnswers((prev) => [{ q: question, a: result.answer, cached: result.cached }, ...prev]);
      setQuestion("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAsking(false);
    }
  }

  return (
    <Section title="Ask About This Design">
      <form onSubmit={ask} className="flex gap-2 mb-5">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Why does this feel premium? How would I recreate the hero?"
          className="flex-1 bg-white border border-line rounded-full px-4 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          disabled={asking}
          className="text-sm border border-ink px-4 py-2 rounded-full hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
        >
          {asking ? "Thinking…" : "Ask"}
        </button>
      </form>
      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}
      <div className="space-y-4">
        {answers.map((item, i) => (
          <div key={i} className="border border-line rounded-md p-4 bg-white">
            <p className="text-sm font-medium mb-1.5">{item.q}</p>
            <p className="text-sm text-muted whitespace-pre-wrap">{item.a}</p>
            {item.cached && <p className="text-xs text-accent mt-1.5">Served from cache</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}
