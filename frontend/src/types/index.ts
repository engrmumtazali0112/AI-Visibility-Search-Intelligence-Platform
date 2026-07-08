export interface ProfileStats {
  total_queries: number;
  avg_opportunity_score: number | null;
  last_run_status: string | null;
  last_run_at: string | null;
}

export interface BusinessProfile {
  profile_uuid: string;
  name: string;
  domain: string;
  industry: string;
  description: string | null;
  competitors: string[];
  status: string;
  created_at: string;
  updated_at: string;
  stats?: ProfileStats;
}

export type VisibilityStatus = "visible" | "not_visible" | "unknown";

export interface DiscoveredQuery {
  query_uuid: string;
  profile_uuid: string;
  run_uuid: string | null;
  query_text: string;
  intent: string | null;
  estimated_search_volume: number;
  competitive_difficulty: number;
  opportunity_score: number;
  domain_visible: boolean;
  visibility_position: number | null;
  visibility_status: VisibilityStatus;
  discovered_at: string;
  last_checked_at: string;
}

export type Priority = "high" | "medium" | "low";

export interface ContentRecommendation {
  recommendation_uuid: string;
  profile_uuid: string;
  target_query_uuid: string;
  content_type: string;
  title: string;
  rationale: string;
  target_keywords: string[];
  priority: Priority;
  created_at: string;
}

export type RunStatus = "running" | "completed" | "failed" | "partial";

export interface PipelineRun {
  run_uuid: string;
  profile_uuid: string;
  status: RunStatus;
  queries_discovered: number;
  queries_scored: number;
  recommendations_generated: number;
  tokens_used: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface PipelineRunResult extends PipelineRun {
  top_opportunity_queries: DiscoveredQuery[];
  recommendations: ContentRecommendation[];
}

export interface Pagination {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface QueriesResponse {
  queries: DiscoveredQuery[];
  pagination: Pagination;
}

export interface ApiErrorShape {
  error: {
    message: string;
    status_code: number;
    details: Record<string, unknown>;
  };
}
