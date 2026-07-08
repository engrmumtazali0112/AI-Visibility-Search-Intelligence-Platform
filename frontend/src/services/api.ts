import type {
  ApiErrorShape,
  BusinessProfile,
  ContentRecommendation,
  PipelineRun,
  PipelineRunResult,
  QueriesResponse,
} from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export class ApiError extends Error {
  statusCode: number;
  details: Record<string, unknown>;

  constructor(message: string, statusCode: number, details: Record<string, unknown> = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Could not reach the API. Is the backend running at " + BASE_URL + "?",
      0
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let details: Record<string, unknown> = {};
    try {
      const body = (await response.json()) as ApiErrorShape;
      message = body.error?.message || message;
      details = body.error?.details || {};
    } catch {
      // response wasn't JSON; keep default message
    }
    throw new ApiError(message, response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export interface CreateProfilePayload {
  name: string;
  domain: string;
  industry: string;
  description?: string;
  competitors: string[];
}

export const api = {
  listProfiles: () =>
    request<{ profiles: BusinessProfile[] }>("/api/v1/profiles").then((r) => r.profiles),

  createProfile: (payload: CreateProfilePayload) =>
    request<BusinessProfile>("/api/v1/profiles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProfile: (profileUuid: string) =>
    request<BusinessProfile>(`/api/v1/profiles/${profileUuid}`),

  runPipeline: (profileUuid: string) =>
    request<PipelineRunResult>(`/api/v1/profiles/${profileUuid}/run`, { method: "POST" }),

  listRuns: (profileUuid: string) =>
    request<{ runs: PipelineRun[] }>(`/api/v1/profiles/${profileUuid}/runs`).then((r) => r.runs),

  getQueries: (
    profileUuid: string,
    params: { minScore?: number; status?: string; page?: number; perPage?: number } = {}
  ) => {
    const search = new URLSearchParams();
    if (params.minScore !== undefined) search.set("min_score", String(params.minScore));
    if (params.status) search.set("status", params.status);
    if (params.page) search.set("page", String(params.page));
    if (params.perPage) search.set("per_page", String(params.perPage));
    const qs = search.toString();
    return request<QueriesResponse>(
      `/api/v1/profiles/${profileUuid}/queries${qs ? `?${qs}` : ""}`
    );
  },

  getRecommendations: (profileUuid: string) =>
    request<{ recommendations: ContentRecommendation[] }>(
      `/api/v1/profiles/${profileUuid}/recommendations`
    ).then((r) => r.recommendations),

  recheckQuery: (queryUuid: string) =>
    request(`/api/v1/queries/${queryUuid}/recheck`, { method: "POST" }),
};
