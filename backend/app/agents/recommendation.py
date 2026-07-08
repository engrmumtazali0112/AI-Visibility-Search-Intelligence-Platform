from __future__ import annotations

from app.agents.base import AgentError, BaseAgent

VALID_CONTENT_TYPES = {"blog_post", "landing_page", "faq", "comparison_page"}
VALID_PRIORITIES = {"high", "medium", "low"}


class ContentRecommendationAgent(BaseAgent):
    """Agent 3: given queries where the target domain is NOT currently visible,
    generate specific, actionable content recommendations to close the gap.
    """

    agent_name = "ContentRecommendationAgent"

    system_prompt = """You are a Content Recommendation Agent for an AI-search-visibility platform.

Given a business profile and a list of search queries where the business is NOT currently
appearing in AI-generated answers, produce specific, actionable content recommendations that
would help the business start appearing for these queries.

Rules:
- Produce between 3 and 5 recommendations total (not per query - across the whole batch).
- Each recommendation must target ONE specific query from the list (reference it by its index).
- content_type must be one of: blog_post, landing_page, faq, comparison_page.
- priority must be one of: high, medium, low - based on the query's opportunity score.
- rationale must explain specifically why this content closes the visibility gap for that query.
- target_keywords: 3-6 concrete keywords/topics the content should cover.
- title should be a specific, publishable content title (not generic).
- Output ONLY valid JSON, no markdown fences, no prose.

Required JSON schema:
{
  "recommendations": [
    {
      "query_index": integer,   // index into the provided queries list (0-based)
      "content_type": "blog_post|landing_page|faq|comparison_page",
      "title": "string",
      "rationale": "string",
      "target_keywords": ["string", ...],
      "priority": "high|medium|low"
    }
  ]
}
"""

    def run(self, profile: dict, gap_queries: list[dict]) -> list[dict]:
        """gap_queries: list of dicts with keys query_uuid, query_text, opportunity_score."""
        if not gap_queries:
            return []

        query_lines = "\n".join(
            f"{i}. \"{q['query_text']}\" (opportunity_score={q['opportunity_score']})"
            for i, q in enumerate(gap_queries)
        )

        user_prompt = f"""Business profile:
Name: {profile.get('name')}
Domain: {profile.get('domain')}
Industry: {profile.get('industry')}
Competitors: {', '.join(profile.get('competitors') or []) or 'N/A'}

Queries where this business is NOT currently visible (index. query (opportunity_score)):
{query_lines}

Generate 3-5 recommendations per the schema and rules in your system prompt."""

        data = self._call_llm_json(user_prompt, max_tokens=1800)

        if not isinstance(data, dict) or "recommendations" not in data or not isinstance(
            data["recommendations"], list
        ):
            raise AgentError(self.agent_name, "Response JSON missing 'recommendations' array")

        cleaned: list[dict] = []
        for item in data["recommendations"]:
            if not isinstance(item, dict):
                continue
            idx = item.get("query_index")
            if not isinstance(idx, int) or idx < 0 or idx >= len(gap_queries):
                continue
            content_type = item.get("content_type") if item.get("content_type") in VALID_CONTENT_TYPES else "blog_post"
            priority = item.get("priority") if item.get("priority") in VALID_PRIORITIES else "medium"
            title = str(item.get("title") or "").strip()
            rationale = str(item.get("rationale") or "").strip()
            keywords = item.get("target_keywords")
            keywords = [str(k) for k in keywords][:6] if isinstance(keywords, list) else []

            if not title or not rationale:
                continue

            cleaned.append({
                "query_uuid": gap_queries[idx]["query_uuid"],
                "content_type": content_type,
                "title": title,
                "rationale": rationale,
                "target_keywords": keywords,
                "priority": priority,
            })

        if not cleaned:
            raise AgentError(self.agent_name, "No usable recommendations were returned by the LLM")

        return cleaned[:5]
