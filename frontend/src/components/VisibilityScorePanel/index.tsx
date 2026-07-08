import type { DiscoveredQuery } from "../../types";
import { OpportunityBar } from "../common";

interface Props {
  avgOpportunityScore: number | null;
  queries: DiscoveredQuery[];
}

export default function VisibilityScorePanel({ avgOpportunityScore, queries }: Props) {
  const scorePct = avgOpportunityScore != null ? Math.round(avgOpportunityScore * 100) : null;
  const topQueries = [...queries].sort((a, b) => b.opportunity_score - a.opportunity_score).slice(0, 4);

  return (
    <div className="card flex flex-col p-5">
      <h2 className="mb-1 font-display text-base font-semibold text-ink">AI Visibility Score</h2>
      <p className="mb-4 text-xs text-muted">Overall visibility score</p>

      <div className="mb-5 flex items-end gap-4 rounded-xl2 bg-canvas px-4 py-4">
        <div>
          <p className="font-display text-4xl font-bold text-primary">{scorePct != null ? `${scorePct}%` : "—"}</p>
          {scorePct != null && (
            <p className="text-xs text-good">+5% from last week</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-line pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Query / Prompt</span>
          <span className="text-right">Score</span>
          <span className="text-right">Source</span>
        </div>
        {topQueries.length === 0 && <p className="py-4 text-sm text-muted">No queries scored yet.</p>}
        {topQueries.map((q) => (
          <div
            key={q.query_uuid}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-line/70 py-2.5 last:border-0"
          >
            <span className="truncate text-sm text-ink" title={q.query_text}>
              {q.query_text}
            </span>
            <span className="text-right text-sm font-semibold tabular-nums text-ink">
              {Math.round(q.opportunity_score * 100)}
            </span>
            <span className="text-right text-sm tabular-nums text-muted">
              {q.estimated_search_volume.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}