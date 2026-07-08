from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.agents import AgentError, ContentRecommendationAgent, QueryDiscoveryAgent, VisibilityScoringAgent
from app.extensions import db
from app.models import ContentRecommendation, DiscoveredQuery, PipelineRun

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """Coordinates Agent 1 -> Agent 2 -> Agent 3 for a business profile.

    Failure isolation: if Agent 2 fails while scoring an individual query, that
    query is skipped (logged) and the rest continue. If Agent 1 or Agent 3 fail
    entirely, the run is marked 'failed' (Agent 1) or 'partial' (Agent 3, since
    discovery + scoring still succeeded and are persisted).
    """

    def __init__(
        self,
        discovery_agent: QueryDiscoveryAgent | None = None,
        scoring_agent: VisibilityScoringAgent | None = None,
        recommendation_agent: ContentRecommendationAgent | None = None,
    ):
        self.discovery_agent = discovery_agent or QueryDiscoveryAgent()
        self.scoring_agent = scoring_agent or VisibilityScoringAgent()
        self.recommendation_agent = recommendation_agent or ContentRecommendationAgent()

    def run(self, profile) -> PipelineRun:
        profile_dict = profile.to_dict()
        run = PipelineRun(profile_uuid=profile.uuid, status="running")
        db.session.add(run)
        db.session.commit()

        total_tokens = 0

        try:
            # ---- Agent 1: Discovery ----
            discovered = self.discovery_agent.run(profile_dict)
            total_tokens += self.discovery_agent.last_tokens_used
        except AgentError as exc:
            logger.error("Discovery agent failed for profile %s: %s", profile.uuid, exc)
            run.status = "failed"
            run.error_message = str(exc)
            run.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            return run

        run.queries_discovered = len(discovered)
        db.session.commit()

        # ---- Agent 2: Scoring (per-query failure isolation) ----
        scored_queries: list[DiscoveredQuery] = []
        for item in discovered:
            try:
                result = self.scoring_agent.run(item["query_text"], profile_dict)
                total_tokens += self.scoring_agent.last_tokens_used
            except AgentError as exc:
                logger.warning(
                    "Scoring agent failed for query '%s' (profile %s): %s",
                    item["query_text"], profile.uuid, exc,
                )
                continue

            query_row = DiscoveredQuery(
                profile_uuid=profile.uuid,
                run_uuid=run.uuid,
                query_text=item["query_text"],
                intent=result["intent"] or item.get("intent"),
                estimated_search_volume=result["estimated_search_volume"],
                competitive_difficulty=result["competitive_difficulty"],
                opportunity_score=result["opportunity_score"],
                domain_visible=result["domain_visible"],
                visibility_position=result["visibility_position"],
                visibility_status=result["visibility_status"],
            )
            db.session.add(query_row)
            scored_queries.append(query_row)

        db.session.commit()
        run.queries_scored = len(scored_queries)
        db.session.commit()

        if not scored_queries:
            run.status = "failed"
            run.error_message = "Discovery succeeded but no queries could be scored"
            run.tokens_used = total_tokens
            run.completed_at = datetime.now(timezone.utc)
            db.session.commit()
            return run

        # ---- Agent 3: Recommendations (top gap queries only) ----
        gap_queries = sorted(
            [q for q in scored_queries if not q.domain_visible],
            key=lambda q: q.opportunity_score,
            reverse=True,
        )[:8]

        gap_payload = [
            {"query_uuid": q.uuid, "query_text": q.query_text, "opportunity_score": q.opportunity_score}
            for q in gap_queries
        ]

        recs_created = 0
        try:
            recommendations = self.recommendation_agent.run(profile_dict, gap_payload)
            total_tokens += self.recommendation_agent.last_tokens_used
            for rec in recommendations:
                rec_row = ContentRecommendation(
                    profile_uuid=profile.uuid,
                    query_uuid=rec["query_uuid"],
                    run_uuid=run.uuid,
                    content_type=rec["content_type"],
                    title=rec["title"],
                    rationale=rec["rationale"],
                    target_keywords=rec["target_keywords"],
                    priority=rec["priority"],
                )
                db.session.add(rec_row)
                recs_created += 1
            db.session.commit()
            run.status = "completed"
        except AgentError as exc:
            logger.warning("Recommendation agent failed for profile %s: %s", profile.uuid, exc)
            run.status = "partial"
            run.error_message = f"Recommendations step failed: {exc}"

        run.recommendations_generated = recs_created
        run.tokens_used = total_tokens
        run.completed_at = datetime.now(timezone.utc)
        db.session.commit()

        return run
