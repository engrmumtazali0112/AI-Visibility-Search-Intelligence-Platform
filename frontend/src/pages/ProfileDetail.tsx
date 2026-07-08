import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import OpportunityChart from "../components/OpportunityChart";
import PipelineStatus from "../components/PipelineStatus";
import ShareOfVoiceChart from "../components/ShareOfVoiceChart";
import SummaryPanel from "../components/SummaryPanel";
import RecentQueriesTable from "../components/RecentQueriesTable";
import VisibilityScorePanel from "../components/VisibilityScorePanel";
import TopOpportunitiesChart from "../components/TopOpportunitiesChart";
import { ErrorState, Spinner } from "../components/common";
import { useProfile } from "../hooks/useProfile";
import { usePipeline } from "../hooks/usePipeline";
import { useQueries, DEFAULT_FILTERS } from "../hooks/useQueries";

export default function ProfileDetail() {
  const { profileUuid } = useParams<{ profileUuid: string }>();
  const { profile, loading, error, reload } = useProfile(profileUuid);

  // Full set (capped) — powers the summary stats, score panel and charts.
  const { queries: allQueries, reload: reloadAll } = useQueries(profileUuid, {
    ...DEFAULT_FILTERS,
    perPage: 100,
  });

  // Paginated slice — powers the "Recent Queries" table, mirroring the Figma
  // "Recent Mentions" table with real pagination.
  const [tablePage, setTablePage] = useState(1);
  const {
    queries: tableQueries,
    pagination,
    loading: tableLoading,
    reload: reloadTable,
  } = useQueries(profileUuid, { ...DEFAULT_FILTERS, page: tablePage, perPage: 6 });

  const [showResult, setShowResult] = useState(false);

  const { trigger, running, result, error: pipelineError } = usePipeline(profileUuid, () => {
    reload();
    reloadAll();
    reloadTable();
    setShowResult(true);
  });

  if (loading) return <Spinner label="Loading profile…" />;
  if (error || !profile) return <ErrorState message={error || "Profile not found"} onRetry={reload} />;

  const stats = profile.stats;

  return (
    <div className="flex flex-col gap-6">
      {/* Header — mirrors the Figma title + AI Engine control slot, adapted to
          this app's real "Run pipeline" action instead of a fake dropdown. */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">{profile.name}</h1>
            <span className="badge bg-primary-light text-primary-dark">{profile.industry}</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Track {profile.domain}'s presence across AI-generated search results.
          </p>
          {profile.description && <p className="mt-2 max-w-2xl text-sm text-ink">{profile.description}</p>}
          {profile.competitors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.competitors.map((c) => (
                <span key={c} className="rounded-full bg-canvas px-2.5 py-1 text-xs text-muted">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <PipelineStatus
          running={running}
          onRun={trigger}
          error={pipelineError}
          lastStatus={stats?.last_run_status}
        />
      </div>

      {showResult && result && (
        <div className="card flex flex-col gap-2 border-primary/30 bg-primary-light/40 p-5">
          <p className="font-display text-sm font-semibold text-primary-dark">
            Pipeline {result.status} — {result.queries_discovered} discovered, {result.queries_scored} scored,{" "}
            {result.recommendations.length} recommendations, {result.tokens_used} tokens used.
          </p>
          {result.error_message && <p className="text-sm text-bad">{result.error_message}</p>}
        </div>
      )}

      {/* Top summary row — mirrors Figma's Total Mentions / AI Search Volume /
          Total Impressions + Top Source Domains / Top Brand Entities layout. */}
      <SummaryPanel
        totalQueries={stats?.total_queries ?? allQueries.length}
        avgOpportunityScore={stats?.avg_opportunity_score ?? null}
        queries={allQueries}
        competitors={profile.competitors}
      />

      {/* Recent Queries table — mirrors Figma's "Recent Mentions" table,
          including the numbered pagination control. */}
      <RecentQueriesTable
        queries={tableQueries}
        pagination={pagination}
        page={tablePage}
        onPageChange={setTablePage}
        loading={tableLoading}
      />

      {tableQueries.length > 0 && (
        <div className="flex justify-end">
          <Link to={`/profiles/${profile.profile_uuid}/queries`} className="text-sm font-semibold text-primary hover:underline">
            View all queries →
          </Link>
        </div>
      )}

      {/* Bottom two-panel row — mirrors Figma's "AI Visibility Score" /
          "Share of Voice by Competitor" pairing. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VisibilityScorePanel avgOpportunityScore={stats?.avg_opportunity_score ?? null} queries={allQueries} />
        <TopOpportunitiesChart queries={allQueries} />
      </div>

      <div className="card p-5">
        <h2 className="mb-1 font-display text-base font-semibold text-ink">Volume vs. difficulty</h2>
        <p className="mb-3 text-sm text-muted">
          Purple points are queries where {profile.domain} isn't currently visible — the biggest
          opportunities sit top-left (high volume, low difficulty).
        </p>
        <OpportunityChart queries={allQueries} />
      </div>
    </div>
  );
}
