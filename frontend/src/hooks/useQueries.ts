import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import type { DiscoveredQuery, Pagination } from "../types";

export interface QueryFilters {
  minScore: number;
  status: string;
  page: number;
  perPage: number;
}

export const DEFAULT_FILTERS: QueryFilters = {
  minScore: 0,
  status: "",
  page: 1,
  perPage: 10,
};

export function useQueries(profileUuid: string | undefined, filters: QueryFilters) {
  const [queries, setQueries] = useState<DiscoveredQuery[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!profileUuid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getQueries(profileUuid, {
        minScore: filters.minScore,
        status: filters.status || undefined,
        page: filters.page,
        perPage: filters.perPage,
      });
      setQueries(data.queries);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load queries");
    } finally {
      setLoading(false);
    }
  }, [profileUuid, filters.minScore, filters.status, filters.page, filters.perPage]);

  useEffect(() => {
    reload();
  }, [reload]);

  const recheck = useCallback(
    async (queryUuid: string) => {
      setRecheckingId(queryUuid);
      try {
        await api.recheckQuery(queryUuid);
        await reload();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Recheck failed");
      } finally {
        setRecheckingId(null);
      }
    },
    [reload]
  );

  return { queries, pagination, loading, error, reload, recheck, recheckingId };
}
