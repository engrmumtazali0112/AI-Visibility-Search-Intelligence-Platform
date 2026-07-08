import type { DiscoveredQuery } from "../../types";

interface Props {
  totalQueries: number;
  avgOpportunityScore: number | null;
  queries: DiscoveredQuery[];
  competitors: string[];
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
    </div>
  );
}

export default function SummaryPanel({ totalQueries, avgOpportunityScore, queries, competitors }: Props) {
  const totalVolume = queries.reduce((sum, q) => sum + q.estimated_search_volume, 0);
  const visibleCount = queries.filter((q) => q.domain_visible).length;
  const notVisibleCount = queries.filter((q) => q.visibility_status === "not_visible").length;
  
  // Mock top source domains (from Figma)
  const topSources = ['wikipedia.org', 'techcrunch.com', 'forbes.com'];
  const topBrands = ['Acme Corp', 'Acme Cloud', 'Acme AI'];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Stats Cards - Top Row */}
      <div className="card p-5">
        <StatCard label="Total Mentions" value={totalQueries.toLocaleString()} />
      </div>
      <div className="card p-5">
        <StatCard label="AI Search Volume" value={totalVolume.toLocaleString()} />
      </div>
      <div className="card p-5">
        <StatCard label="Total Impressions" value={Math.round(totalVolume * 5.7).toLocaleString()} />
      </div>
      
      {/* Top Sources & Brands */}
      <div className="card p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted">Top Sources</p>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              {topSources.map((source, i) => (
                <li key={i}>{source}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Top Brands</p>
            <ul className="mt-2 space-y-1 text-sm text-ink">
              {topBrands.map((brand, i) => (
                <li key={i}>{brand}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}