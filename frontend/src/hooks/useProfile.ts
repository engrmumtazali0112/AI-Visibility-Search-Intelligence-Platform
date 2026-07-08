import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import type { BusinessProfile } from "../types";

export function useProfile(profileUuid: string | undefined) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!profileUuid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProfile(profileUuid);
      setProfile(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [profileUuid]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { profile, loading, error, reload };
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { profiles, loading, error, reload };
}
