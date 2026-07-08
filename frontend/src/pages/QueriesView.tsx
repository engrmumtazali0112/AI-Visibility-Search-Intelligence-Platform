import { useParams } from "react-router-dom";
import { useState } from "react";
import QueryTable from "../components/QueryTable";
import { EmptyState, ErrorState, Spinner } from "../components/common";
import { DEFAULT_FILTERS, useQueries } from "../hooks/useQueries";
import type { QueryFilters } from "../hooks/useQueries";

export default function QueriesView() {
  const { profileUuid } = useParams<{ profileUuid: string }>();
  const [filters, setFilters] = useState<QueryFilters>(DEFAULT_FILTERS);
  const { queries, pagination, loading, error, reload, recheck, recheckingId } = useQueries(
    profileUuid,
    filters
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Discovered queries</h1>
        <p className="mt-1 text-sm text-muted">
          Sorted by opportunity score. Recheck a query after you've published content for it.
        </p>
      </div>

      <div className="card flex flex-wrap items-end gap-5 p-4">
        <div className="flex-1 min-w-[220px]">
          <label className="label" htmlFor="min-score">
            Min. opportunity score: {filters.minScore.toFixed(2)}
          </label>
          <input
            id="min-score"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={filters.minScore}
            onChange={(e) =>
              setFilters((f) => ({ ...f, minScore: Number(e.target.value), page: 1 }))
            }
            className="w-full accent-primary"
          />
        </div>

        <div className="min-w-[180px]">
          <label className="label" htmlFor="status-filter">Visibility status</label>
          <select
            id="status-filter"
            className="input"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          >
            <option value="">All statuses</option>
            <option value="visible">Visible</option>
            <option value="not_visible">Not visible</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        {(filters.minScore > 0 || filters.status) && (
          <button className="btn-secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
            Clear filters
          </button>
        )}
      </div>

      <div className="card p-5">
        {loading && <Spinner label="Loading queries…" />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && queries.length === 0 && (
          <EmptyState
            title="No queries match these filters"
            description="Try lowering the minimum opportunity score or clearing the visibility filter. If you haven't run the pipeline yet, do that first from the profile overview."
          />
        )}
        {!loading && !error && queries.length > 0 && (
          <>
            <QueryTable queries={queries} onRecheck={recheck} recheckingId={recheckingId} />
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
                <p className="text-muted">
                  Page {pagination.page} of {pagination.total_pages} · {pagination.total_items} total
                </p>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary px-3 py-1.5"
                    disabled={filters.page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                  >
                    Previous
                  </button>
                  <button
                    className="btn-secondary px-3 py-1.5"
                    disabled={filters.page >= pagination.total_pages}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
