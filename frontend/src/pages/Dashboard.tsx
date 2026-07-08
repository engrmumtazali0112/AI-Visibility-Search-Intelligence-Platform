import { Link } from "react-router-dom";
import ProfileCard from "../components/ProfileCard";
import { EmptyState, ErrorState, Spinner } from "../components/common";
import { useProfiles } from "../hooks/useProfile";

export default function Dashboard() {
  const { profiles, loading, error, reload } = useProfiles();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">AI Visibility</h1>
          <p className="mt-1 text-sm text-muted">
            Track AI-search visibility across every business you're monitoring.
          </p>
        </div>
        <Link to="/profiles/new" className="btn-primary">
          + New profile
        </Link>
      </div>

      {loading && <Spinner label="Loading profiles…" />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && profiles.length === 0 && (
        <EmptyState
          title="No profiles yet"
          description="Register a business profile to start discovering AI-search queries and tracking visibility."
          action={
            <Link to="/profiles/new" className="btn-primary">
              Create your first profile
            </Link>
          }
        />
      )}

      {!loading && !error && profiles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((p) => (
            <ProfileCard key={p.profile_uuid} profile={p} />
          ))}
        </div>
      )}
    </div>
  );
}