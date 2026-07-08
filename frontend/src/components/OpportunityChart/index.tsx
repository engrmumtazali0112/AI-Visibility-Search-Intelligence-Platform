import {
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DiscoveredQuery } from "../../types";

export default function OpportunityChart({ queries }: { queries: DiscoveredQuery[] }) {
  const data = queries.map((q) => ({
    x: q.competitive_difficulty,
    y: q.estimated_search_volume,
    z: q.opportunity_score,
    name: q.query_text,
    visible: q.domain_visible,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        Run the pipeline to see opportunity data.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid stroke="#EAE8F2" />
        <XAxis
          type="number"
          dataKey="x"
          name="Difficulty"
          domain={[0, 100]}
          tick={{ fontSize: 12, fill: "#8B87A0" }}
          label={{ value: "Competitive difficulty", position: "insideBottom", offset: -5, fontSize: 12, fill: "#8B87A0" }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Volume"
          tick={{ fontSize: 12, fill: "#8B87A0" }}
          label={{ value: "Search volume", angle: -90, position: "insideLeft", fontSize: 12, fill: "#8B87A0" }}
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload;
            return (
              <div className="max-w-xs rounded-lg border border-line bg-surface p-3 text-xs shadow-card">
                <p className="mb-1 font-medium text-ink">{p.name}</p>
                <p className="text-muted">Volume: {p.y.toLocaleString()}</p>
                <p className="text-muted">Difficulty: {p.x}</p>
                <p className="text-muted">Opportunity: {p.z.toFixed(2)}</p>
                <p className="text-muted">{p.visible ? "Currently visible" : "Not visible"}</p>
              </div>
            );
          }}
        />
        <Scatter data={data}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.visible ? "#8B87A0" : "#6E4CF0"} fillOpacity={0.8} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
