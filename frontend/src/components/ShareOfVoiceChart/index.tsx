import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface Props {
  domain: string;
  competitors: string[];
  queries: DiscoveredQuery[];
}

export default function ShareOfVoiceChart({ domain, competitors, queries }: Props) {
  // Calculate mock SOV based on query visibility
  const totalQueries = queries.length || 1;
  const visibleCount = queries.filter(q => q.domain_visible).length;
  const yourSOV = Math.round((visibleCount / totalQueries) * 100);

  const data = [
    { name: `${domain} (You)`, value: Math.max(yourSOV, 15), isYou: true },
    ...competitors.slice(0, 4).map((comp, i) => ({
      name: comp.replace(/\.[^/.]+$/, ""),
      value: Math.max(20 + Math.random() * 40, 15),
      isYou: false,
    })),
  ];

  return (
    <div className="card flex flex-col p-5">
      <h2 className="mb-1 font-display text-base font-semibold text-ink">Share of Voice by Competitor</h2>
      <p className="mb-4 text-xs text-muted">Visibility share across your brand and competitors</p>

      {data.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-muted">
          Run the pipeline to see SOV data.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12, fill: "#14121F" }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                {data.map((entry, i) => (
                  <Cell 
                    key={i} 
                    fill={entry.isYou ? "#6E4CF0" : "#B9AEF6"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> Your Brand
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#B9AEF6]" /> Competitors
            </span>
          </div>
        </>
      )}
    </div>
  );
}