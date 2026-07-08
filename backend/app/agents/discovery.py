from __future__ import annotations

from app.agents.base import AgentError, BaseAgent


class QueryDiscoveryAgent(BaseAgent):
    """Agent 1: generates realistic AI-assistant search queries for a business's
    competitive space.
    """

    agent_name = "QueryDiscoveryAgent"

    system_prompt = """You are a Query Discovery Agent for a B2B SEO/AI-visibility intelligence platform.

Your job: given a business profile, generate realistic, natural-language questions that real
buyers would type into an AI assistant (ChatGPT, Claude, Perplexity) when researching products
or services in this space.

Rules:
- Generate between 10 and 20 queries.
- Queries must be commercially relevant (a buyer evaluating options), not generic trivia.
- Include a mix of intent types: comparison queries ("X vs Y"), best-of/roundup queries
  ("best tool for..."), transactional queries (pricing/alternatives), and informational
  queries (how does X work / how to do Y).
- Reference the named competitors naturally in some comparison queries.
- Do not repeat the same question phrased two ways.
- Output ONLY valid JSON. No markdown fences, no prose before or after.

Required JSON schema:
{
  "queries": [
    {"query_text": "string", "intent": "comparison|best_of|transactional|informational"}
  ]
}
"""

    def run(self, profile: dict) -> list[dict]:
        user_prompt = f"""Business profile:
Name: {profile.get('name')}
Domain: {profile.get('domain')}
Industry: {profile.get('industry')}
Description: {profile.get('description') or 'N/A'}
Competitors: {', '.join(profile.get('competitors') or []) or 'N/A'}

Generate 10-20 queries per the schema and rules in your system prompt."""

        data = self._call_llm_json(user_prompt, max_tokens=2000)

        if not isinstance(data, dict) or "queries" not in data or not isinstance(data["queries"], list):
            raise AgentError(self.agent_name, "Response JSON missing 'queries' array")

        cleaned: list[dict] = []
        for item in data["queries"]:
            if not isinstance(item, dict):
                continue
            text = str(item.get("query_text") or "").strip()
            if not text:
                continue
            intent = item.get("intent") if item.get("intent") in (
                "comparison", "best_of", "transactional", "informational"
            ) else None
            cleaned.append({"query_text": text, "intent": intent})

        if not cleaned:
            raise AgentError(self.agent_name, "No usable queries were returned by the LLM")

        return cleaned[:20]
