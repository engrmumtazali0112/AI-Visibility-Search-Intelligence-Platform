import { useEffect, useState } from "react";

interface Props {
  running: boolean;
  onRun: () => void;
  error: string | null;
  lastStatus?: string | null;
}

export default function PipelineStatus({ running, onRun, error, lastStatus }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => setElapsed(Math.round((Date.now() - start) / 1000)), 250);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div className="flex items-center gap-3">
      {running && (
        <div className="flex items-center gap-2 rounded-lg bg-primary-light px-3 py-2 text-sm font-medium text-primary-dark">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-dark/30 border-t-primary-dark" />
          Running pipeline… {elapsed}s
        </div>
      )}
      {!running && error && (
        <span className="text-sm font-medium text-bad">{error}</span>
      )}
      {!running && !error && lastStatus && (
        <span className="text-xs text-muted">Last run: {lastStatus}</span>
      )}
      <button className="btn-primary" onClick={onRun} disabled={running}>
        {running ? "Running…" : "Run pipeline"}
      </button>
    </div>
  );
}
