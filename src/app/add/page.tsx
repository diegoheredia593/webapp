"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";

type Tab = "screenshot" | "code" | "manual" | "url";

const TABS: { id: Tab; label: string }[] = [
  { id: "screenshot", label: "Screenshot / Image" },
  { id: "code", label: "Code" },
  { id: "url", label: "Website URL" },
  { id: "manual", label: "Manual" },
];

export default function AddPage() {
  const [tab, setTab] = useState<Tab>("screenshot");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="pt-8 max-w-2xl">
      <h1 className="font-serif text-3xl tracking-tight mb-2">Add Inspiration</h1>
      <p className="text-muted text-sm mb-8">
        Screenshots and code are analyzed once with Claude and never reprocessed. Manual and URL
        entries are saved directly — no AI call needed.
      </p>

      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-sm px-4 py-2 rounded-full border transition-colors ${
              tab === t.id ? "border-ink bg-ink text-paper" : "border-line text-muted hover:border-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {error}
        </p>
      )}

      {tab === "screenshot" && (
        <ScreenshotForm busy={busy} setBusy={setBusy} setError={setError} router={router} />
      )}
      {tab === "code" && <CodeForm busy={busy} setBusy={setBusy} setError={setError} router={router} />}
      {tab === "url" && <UrlForm busy={busy} setBusy={setBusy} setError={setError} router={router} />}
      {tab === "manual" && <ManualForm busy={busy} setBusy={setBusy} setError={setError} router={router} />}
    </div>
  );
}

type FormProps = {
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (e: string | null) => void;
  router: ReturnType<typeof useRouter>;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-5">
      <span className="block text-xs uppercase tracking-wide text-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full bg-white border border-line rounded-md px-3.5 py-2.5 text-sm outline-none focus:border-ink transition-colors";

function ScreenshotForm({ busy, setBusy, setError, router }: FormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image file first.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", title);
      form.append("sourceUrl", sourceUrl);
      form.append("notes", notes);
      form.append("sourceType", "screenshot");
      const { inspiration, deduped } = await api.uploadScreenshot(form);
      if (!deduped) {
        // Fire analysis without blocking navigation — the detail page
        // polls for status, so the user sees "Analyzing…" immediately
        // instead of a blocking spinner.
        api.analyze(inspiration.id).catch(() => {});
      }
      router.push(`/inspiration/${inspiration.id}`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Field label="Image">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
          className="text-sm"
        />
      </Field>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Preview" className="w-full rounded-md border border-line mb-5 max-h-80 object-cover" />
      )}
      <Field label="Title (optional — Claude will suggest one)">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Source URL (optional)">
        <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className={inputClass} placeholder="https://…" />
      </Field>
      <Field label="Notes (optional)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} />
      </Field>
      <button
        disabled={busy}
        className="text-sm border border-ink px-5 py-2.5 rounded-full hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
      >
        {busy ? "Uploading…" : "Save & Analyze"}
      </button>
    </form>
  );
}

function CodeForm({ busy, setBusy, setError, router }: FormProps) {
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("HTML/CSS");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [code, setCode] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError("Paste some code first.");
      return;
    }
    setBusy(true);
    try {
      const { inspiration } = await api.createCode({ title, language, sourceUrl, notes, code });
      api.analyzeCode(inspiration.id).catch(() => {});
      router.push(`/inspiration/${inspiration.id}`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Language">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputClass}>
          {["HTML/CSS", "JavaScript", "TypeScript", "React", "Tailwind", "Other"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </Field>
      <Field label="Source URL (optional)">
        <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Code">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={`${inputClass} font-mono text-xs`}
          rows={14}
          placeholder="Paste HTML, CSS, JS, React, Tailwind…"
        />
      </Field>
      <Field label="Notes (optional)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} />
      </Field>
      <button
        disabled={busy}
        className="text-sm border border-ink px-5 py-2.5 rounded-full hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save & Analyze"}
      </button>
    </form>
  );
}

function UrlForm({ busy, setBusy, setError, router }: FormProps) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!sourceUrl.trim()) {
      setError("Enter a URL.");
      return;
    }
    setBusy(true);
    try {
      const { inspiration } = await api.createManual({
        title,
        sourceUrl,
        notes,
        sourceType: "url",
      });
      router.push(`/inspiration/${inspiration.id}`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p className="text-sm text-muted mb-5 bg-line/30 rounded-md px-4 py-3">
        For now, URLs are saved as reference links. Attach a screenshot from the Screenshot tab for
        full AI design analysis — automatic screenshot capture is planned for a later version.
      </p>
      <Field label="Website URL">
        <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className={inputClass} placeholder="https://…" />
      </Field>
      <Field label="Title (optional)">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Notes (optional)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={3} />
      </Field>
      <button
        disabled={busy}
        className="text-sm border border-ink px-5 py-2.5 rounded-full hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function ManualForm({ busy, setBusy, setError, router }: FormProps) {
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() && !sourceUrl.trim()) {
      setError("Provide at least a title or URL.");
      return;
    }
    setBusy(true);
    try {
      const { inspiration } = await api.createManual({
        title,
        sourceUrl,
        notes,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      router.push(`/inspiration/${inspiration.id}`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </Field>
      <Field label="URL (optional)">
        <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={4} />
      </Field>
      <Field label="Tags (comma separated)">
        <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} placeholder="minimal, hero, dark" />
      </Field>
      <button
        disabled={busy}
        className="text-sm border border-ink px-5 py-2.5 rounded-full hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
