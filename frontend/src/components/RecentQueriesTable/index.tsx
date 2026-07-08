import type { DiscoveredQuery, Pagination as PaginationType } from "../../types";
import { OpportunityBar, VisibilityBadge } from "../common";
import Pagination from "../Pagination";

interface Props {
  queries: DiscoveredQuery[];
  pagination: PaginationType | null;
  page: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export default function RecentQueriesTable({ queries, pagination, page, onPageChange, loading }: Props) {
  // Mock platforms and SOV for demo (from Figma)
  const getPlatform = (index: number) => ['ChatGPT', 'Google', 'Claude', 'Perplexity'][index % 4];
  const getSOV = (score: number) => `${Math.round(score * 40 + 20)}%`;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Recent Mentions</h2>
        <div className="flex items-center gap-3">
          <select className="input text-xs py-1.5 px-3 w-auto">
            <option>All Engines</option>
            <option>ChatGPT</option>
            <option>Google</option>
            <option>Claude</option>
          </select>
          <select className="input text-xs py-1.5 px-3 w-auto">
            <option>All Platforms</option>
          </select>
          <select className="input text-xs py-1.5 px-3 w-auto">
            <option>All Locations</option>
          </select>
          <select className="input text-xs py-1.5 px-3 w-auto">
            <option>All Languages</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="py-3 pr-4">Query / Prompt</th>
              <th className="py-3 pr-4">Platform</th>
              <th className="py-3 pr-4">Mentioned</th>
              <th className="py-3 pr-4">AI Search Vol</th>
              <th className="py-3 pr-4">Sources</th>
              <th className="py-3 pr-4">Snippet</th>
              <th className="py-3 pr-4">SOV</th>
              <th className="py-3 pr-4">Location</th>
              <th className="py-3 pr-4">Last Checked</th>
            </tr>
          </thead>
          <tbody>
            {queries.map((q, index) => (
              <tr key={q.query_uuid} className="border-b border-line/70 last:border-0 hover:bg-canvas/60">
                <td className="max-w-[200px] py-3.5 pr-4">
                  <p className="truncate font-medium text-ink" title={q.query_text}>
                    {q.query_text}
                  </p>
                </td>
                <td className="py-3.5 pr-4 text-ink">{getPlatform(index)}</td>
                <td className="py-3.5 pr-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    q.domain_visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {q.domain_visible ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-3.5 pr-4 tabular-nums text-ink">{q.estimated_search_volume.toLocaleString()}</td>
                <td className="py-3.5 pr-4 tabular-nums text-ink">{Math.floor(Math.random() * 20) + 5}</td>
                <td className="max-w-[180px] py-3.5 pr-4">
                  <p className="truncate text-xs text-muted" title={q.query_text}>
                    {q.query_text.slice(0, 40)}...
                  </p>
                </td>
                <td className="py-3.5 pr-4 font-semibold text-ink">{getSOV(q.opportunity_score)}</td>
                <td className="py-3.5 pr-4 text-xs text-muted">US/EN</td>
                <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-muted">
                  {new Date(q.last_checked_at).toLocaleDateString()} {new Date(q.last_checked_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </td>
              </tr>
            ))}
            {!loading && queries.length === 0 && (
              <tr>
                <td colSpan={9} className="py-10 text-center text-sm text-muted">
                  No queries yet. Run the pipeline to discover queries for this profile.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total_items > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-xs text-muted">
            Showing {(pagination.page - 1) * pagination.per_page + 1}–
            {Math.min(pagination.page * pagination.per_page, pagination.total_items)} of{" "}
            {pagination.total_items}
          </p>
          <Pagination page={page} totalPages={pagination.total_pages} onChange={onPageChange} />
        </div>
      )}
    </div>
  );
}