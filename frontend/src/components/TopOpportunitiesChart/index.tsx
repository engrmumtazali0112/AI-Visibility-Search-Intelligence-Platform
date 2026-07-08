import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { DiscoveredQuery } from "../../types";

export default function TopOpportunitiesChart({ queries }: { queries: DiscoveredQuery[] }) {
  const data = [...queries]
    .sort((a, b) => b.opportunity_score - a.opportunity_score)
    .slice(0, 5)
    .map((q) => ({
      name: q.query_text.length > 28 ? `${q.query_text.slice(0, 28)}…` : q.query_text,
      value: Math.round(q.opportunity_score * 100),
      visible: q.domain_visible,
    }))
    .reverse();

  return (
    <div className="card flex flex-col p-5">
      <h2 className="mb-1 font-display text-base font-semibold text-ink">Top Opportunities</h2>
      <p className="mb-4 text-xs text-muted">Highest-scoring queries ranked by opportunity</p>

      {data.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-muted">
          Run the pipeline to see ranked opportunities.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 44)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{ fontSize: 12, fill: "#14121F" }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.visible ? "#B9AEF6" : "#6E4CF0"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Not visible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#B9AEF6]" /> Visible
        </span>
      </div>
    </div>
  );
}
