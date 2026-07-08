import { Link } from "react-router-dom";
import type { BusinessProfile } from "../../types";

const statusStyles: Record<string, string> = {
  completed: "bg-good/10 text-good",
  running: "bg-warn/10 text-warn",
  failed: "bg-bad/10 text-bad",
  partial: "bg-warn/10 text-warn",
};

export default function ProfileCard({ profile }: { profile: BusinessProfile }) {
  const stats = profile.stats;
  const lastRunStatus = stats?.last_run_status;

  return (
    <Link
      to={`/profiles/${profile.profile_uuid}`}
      className="card group flex flex-col gap-4 p-5 transition-shadow hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-ink">{profile.name}</p>
          <p className="truncate text-sm text-muted">{profile.domain}</p>
        </div>
        {lastRunStatus && (
          <span className={`badge shrink-0 ${statusStyles[lastRunStatus] || "bg-muted/10 text-muted"}`}>
            {lastRunStatus}
          </span>
        )}
      </div>

      <span className="badge w-fit bg-primary-light text-primary-dark">{profile.industry}</span>

      <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Queries</p>
          <p className="font-display text-lg font-bold text-ink">{stats?.total_queries ?? 0}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Avg opportunity</p>
          <p className="font-display text-lg font-bold text-ink">
            {stats?.avg_opportunity_score != null ? stats.avg_opportunity_score.toFixed(2) : "—"}
          </p>
        </div>
      </div>
    </Link>
  );
}
