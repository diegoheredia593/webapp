import type { AnalysisStatus } from "@/lib/types";

const LABELS: Record<AnalysisStatus, string> = {
  uploaded: "Queued",
  analyzing: "Analyzing…",
  completed: "Analyzed",
  failed: "Failed",
  needs_retry: "Needs retry",
};

const DOT: Record<AnalysisStatus, string> = {
  uploaded: "bg-muted",
  analyzing: "bg-accent animate-pulse",
  completed: "bg-emerald-600",
  failed: "bg-red-600",
  needs_retry: "bg-amber-600",
};

export default function StatusBadge({ status }: { status: AnalysisStatus }) {
  if (status === "completed") return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted bg-paper/90 border border-line rounded-full px-2.5 py-1">
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[status]}`} />
      {LABELS[status]}
    </span>
  );
}
