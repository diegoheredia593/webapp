import { getUsageSummary } from "@/lib/db/usage";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export default async function UsagePage() {
  const usage = await getUsageSummary();

  const barColor =
    usage.budget_used_pct >= 100
      ? "bg-red-600"
      : usage.budget_used_pct >= 90
      ? "bg-amber-600"
      : usage.budget_used_pct >= 75
      ? "bg-amber-500"
      : usage.budget_used_pct >= 50
      ? "bg-accent"
      : "bg-emerald-600";

  return (
    <div className="pt-8 pb-20 max-w-2xl">
      <h1 className="font-serif text-3xl tracking-tight mb-2">AI Usage</h1>
      <p className="text-muted text-sm mb-10">
        Every Claude call this library makes is logged here — vision analysis, code analysis,
        questions, comparisons, and embeddings. Browsing, searching, and favoriting never appear
        in this list because they never touch the AI.
      </p>

      <div className="border border-line rounded-lg p-6 mb-10 bg-white">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-medium">Monthly budget</h2>
          <span className="text-sm text-muted">
            ${usage.estimated_cost_usd.toFixed(2)} / ${usage.monthly_budget_usd.toFixed(2)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-line overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${Math.min(usage.budget_used_pct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-2">
          {usage.budget_used_pct.toFixed(1)}% used this month.
          {usage.budget_used_pct >= 100 &&
            " Non-essential AI requests (questions, comparisons) are now blocked unless explicitly overridden."}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Images analyzed" value={fmt(usage.images_analyzed)} />
        <Stat label="AI requests" value={fmt(usage.ai_requests)} />
        <Stat label="Input tokens" value={fmt(usage.input_tokens)} />
        <Stat label="Output tokens" value={fmt(usage.output_tokens)} />
        <Stat label="Estimated cost" value={`$${usage.estimated_cost_usd.toFixed(2)}`} />
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm uppercase tracking-wide text-muted mb-3">By model</h3>
          <div className="space-y-2">
            {usage.by_model.map((m) => (
              <div key={m.model} className="flex justify-between text-sm border-b border-line pb-2">
                <span className="font-mono text-xs">{m.model}</span>
                <span className="text-muted">
                  {m.requests} req · ${m.cost_usd.toFixed(2)}
                </span>
              </div>
            ))}
            {usage.by_model.length === 0 && <p className="text-sm text-muted">No requests yet.</p>}
          </div>
        </div>
        <div>
          <h3 className="text-sm uppercase tracking-wide text-muted mb-3">By request type</h3>
          <div className="space-y-2">
            {usage.by_type.map((t) => (
              <div key={t.request_type} className="flex justify-between text-sm border-b border-line pb-2">
                <span>{t.request_type.replace("_", " ")}</span>
                <span className="text-muted">
                  {t.requests} req · ${t.cost_usd.toFixed(2)}
                </span>
              </div>
            ))}
            {usage.by_type.length === 0 && <p className="text-sm text-muted">No requests yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line rounded-lg p-4 bg-white">
      <p className="text-2xl font-serif">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}
