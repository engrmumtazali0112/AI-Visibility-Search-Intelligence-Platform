from __future__ import annotations

from app.agents.base import AgentError, BaseAgent
from app.utils.scoring import classify_intent, compute_opportunity_score, estimate_query_metrics


class VisibilityScoringAgent(BaseAgent):
    """Agent 2: simulates whether a target domain would be surfaced in an
    AI-generated answer for a given query, and scores the query.

    Design note: estimated_search_volume / competitive_difficulty come from
    `estimate_query_metrics()` (real provider if configured, deterministic
    heuristic otherwise - see app/utils/scoring.py). The LLM's job is
    specifically the part that requires reasoning: simulating whether the
    domain would plausibly be cited/mentioned in an AI answer for this query,
    given the domain, its competitors, and the query itself.
    """

    agent_name = "VisibilityScoringAgent"

    system_prompt = """You are a Visibility Scoring Agent for an AI-search-visibility platform.

Given a single search query and a target business (domain, industry, competitors), simulate
whether that business's domain would plausibly be mentioned/cited in an AI assistant's
generated answer for that query, based on the business's apparent relevance, scale, and
positioning versus the named competitors. This is a simulation/estimate, not a live web check.

Output ONLY valid JSON, no markdown fences, no prose:
{
  "domain_visible": true|false,
  "visibility_position": integer|null,   // approximate rank among cited sources if visible, else null
  "reasoning": "one short sentence"
}
"""

    def run(self, query_text: str, profile: dict) -> dict:
        metrics = estimate_query_metrics(query_text)

        user_prompt = f"""Query: "{query_text}"

Target business:
Name: {profile.get('name')}
Domain: {profile.get('domain')}
Industry: {profile.get('industry')}
Competitors: {', '.join(profile.get('competitors') or []) or 'N/A'}

Simulate visibility per your system prompt and return the required JSON."""

        data = self._call_llm_json(user_prompt, max_tokens=400)

        if not isinstance(data, dict) or "domain_visible" not in data:
            raise AgentError(self.agent_name, "Response JSON missing 'domain_visible'")

        domain_visible = bool(data.get("domain_visible"))
        position = data.get("visibility_position")
        position = int(position) if isinstance(position, (int, float)) and domain_visible else None

        opportunity_score = compute_opportunity_score(
            search_volume=metrics["estimated_search_volume"],
            competitive_difficulty=metrics["competitive_difficulty"],
            domain_visible=domain_visible,
            query_text=query_text,
        )

        return {
            "estimated_search_volume": metrics["estimated_search_volume"],
            "competitive_difficulty": metrics["competitive_difficulty"],
            "opportunity_score": opportunity_score,
            "domain_visible": domain_visible,
            "visibility_position": position,
            "visibility_status": "visible" if domain_visible else "not_visible",
            "intent": classify_intent(query_text),
        }
