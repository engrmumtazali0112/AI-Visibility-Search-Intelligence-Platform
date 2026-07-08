import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EmptyState, ErrorState, Spinner } from "../components/common";
import { api, ApiError } from "../services/api";
import type { PipelineRun, RunStatus } from "../types";

const statusStyles: Record<RunStatus, string> = {
  completed: "bg-good/10 text-good",
  running: "bg-warn/10 text-warn",
  failed: "bg-bad/10 text-bad",
  partial: "bg-warn/10 text-warn",
};

export default function RunHistory() {
  const { profileUuid } = useParams<{ profileUuid: string }>();
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!profileUuid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listRuns(profileUuid);
      setRuns(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load run history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUuid]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Pipeline run history</h1>
        <p className="mt-1 text-sm text-muted">Every 3-agent pipeline run for this profile.</p>
      </div>

      {loading && <Spinner label="Loading run history…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && runs.length === 0 && (
        <EmptyState title="No runs yet" description="Trigger the pipeline from the profile overview to see history here." />
      )}

      {!loading && !error && runs.length > 0 && (
        <div className="card divide-y divide-line overflow-hidden">
          {runs.map((run) => (
            <div key={run.run_uuid} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className={`badge ${statusStyles[run.status]}`}>{run.status}</span>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {new Date(run.started_at).toLocaleString()}
                  </p>
                  {run.error_message && <p className="text-xs text-bad">{run.error_message}</p>}
                </div>
              </div>
              <div className="flex gap-6 text-sm text-muted">
                <Metric label="Discovered" value={run.queries_discovered} />
                <Metric label="Scored" value={run.queries_scored} />
                <Metric label="Recs" value={run.recommendations_generated} />
                <Metric label="Tokens" value={run.tokens_used} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <p className="text-xs uppercase tracking-wide text-muted/70">{label}</p>
      <p className="font-semibold text-ink">{value}</p>
    </div>
  );
}
