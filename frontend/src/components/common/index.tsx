import type { ReactNode } from "react";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-primary" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl2 border border-bad/20 bg-bad/5 px-6 py-10 text-center">
      <p className="text-sm font-medium text-bad">{message}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-line bg-canvas px-6 py-14 text-center">
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action}
    </div>
  );
}

export function VisibilityBadge({ status }: { status: "visible" | "not_visible" | "unknown" }) {
  const styles: Record<string, string> = {
    visible: "bg-good/10 text-good",
    not_visible: "bg-bad/10 text-bad",
    unknown: "bg-muted/10 text-muted",
  };
  const labels: Record<string, string> = {
    visible: "Visible",
    not_visible: "Not visible",
    unknown: "Unknown",
  };
  return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const styles: Record<string, string> = {
    high: "bg-bad/10 text-bad",
    medium: "bg-warn/10 text-warn",
    low: "bg-muted/10 text-muted",
  };
  return <span className={`badge ${styles[priority]}`}>{priority.toUpperCase()}</span>;
}

export function OpportunityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.66 ? "bg-good" : score >= 0.33 ? "bg-warn" : "bg-muted";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-ink">{score.toFixed(2)}</span>
    </div>
  );
}
