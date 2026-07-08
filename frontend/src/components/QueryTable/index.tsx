import type { DiscoveredQuery } from "../../types";
import { OpportunityBar, VisibilityBadge } from "../common";

interface Props {
  queries: DiscoveredQuery[];
  onRecheck: (queryUuid: string) => void;
  recheckingId: string | null;
}

export default function QueryTable({ queries, onRecheck, recheckingId }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="py-3 pr-4">Query</th>
            <th className="py-3 pr-4">Volume</th>
            <th className="py-3 pr-4">Difficulty</th>
            <th className="py-3 pr-4">Opportunity</th>
            <th className="py-3 pr-4">Visibility</th>
            <th className="py-3 pr-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {queries.map((q) => (
            <tr key={q.query_uuid} className="border-b border-line/70 last:border-0 hover:bg-canvas/60">
              <td className="max-w-[320px] py-3.5 pr-4">
                <p className="truncate font-medium text-ink" title={q.query_text}>
                  {q.query_text}
                </p>
                {q.intent && <p className="text-xs text-muted">{q.intent.replace("_", " ")}</p>}
              </td>
              <td className="py-3.5 pr-4 tabular-nums text-ink">{q.estimated_search_volume.toLocaleString()}</td>
              <td className="py-3.5 pr-4 tabular-nums text-ink">{q.competitive_difficulty}</td>
              <td className="py-3.5 pr-4">
                <OpportunityBar score={q.opportunity_score} />
              </td>
              <td className="py-3.5 pr-4">
                <VisibilityBadge status={q.visibility_status} />
              </td>
              <td className="py-3.5 pr-4 text-right">
                <button
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => onRecheck(q.query_uuid)}
                  disabled={recheckingId === q.query_uuid}
                >
                  {recheckingId === q.query_uuid ? "Rechecking…" : "Recheck"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
