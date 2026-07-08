import { useCallback, useState } from "react";
import { api, ApiError } from "../services/api";
import type { PipelineRunResult } from "../types";

export function usePipeline(profileUuid: string | undefined, onComplete?: () => void) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PipelineRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trigger = useCallback(async () => {
    if (!profileUuid) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.runPipeline(profileUuid);
      setResult(data);
      onComplete?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Pipeline run failed");
    } finally {
      setRunning(false);
    }
  }, [profileUuid, onComplete]);

  return { trigger, running, result, error };
}
