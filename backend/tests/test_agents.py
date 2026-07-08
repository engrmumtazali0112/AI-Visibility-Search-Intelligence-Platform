"""
Unit tests for agent logic using mocked LLM responses (no real API calls).
Run with: pytest tests/ -v
"""
import json
from unittest.mock import MagicMock

import pytest

from app import create_app
from app.agents import AgentError, ContentRecommendationAgent, QueryDiscoveryAgent, VisibilityScoringAgent
from app.extensions import db
from app.utils.scoring import classify_intent, compute_opportunity_score


@pytest.fixture()
def app():
    application = create_app("testing")
    with application.app_context():
        db.create_all()
        yield application
        db.drop_all()


def _fake_client(response_text: str):
    block = MagicMock()
    block.type = "text"
    block.text = response_text

    usage = MagicMock()
    usage.input_tokens = 50
    usage.output_tokens = 25

    response = MagicMock()
    response.content = [block]
    response.usage = usage

    client = MagicMock()
    client.messages.create.return_value = response
    return client


PROFILE = {
    "name": "Frase",
    "domain": "frase.io",
    "industry": "SEO Content Tools",
    "description": "AI content briefs",
    "competitors": ["surferseo.com"],
}


class TestQueryDiscoveryAgent:
    def test_parses_valid_json(self, app):
        payload = json.dumps({"queries": [
            {"query_text": "Best AI content brief tool?", "intent": "best_of"},
            {"query_text": "Frase vs Surfer SEO?", "intent": "comparison"},
        ]})
        agent = QueryDiscoveryAgent(client=_fake_client(payload))
        with app.app_context():
            result = agent.run(PROFILE)
        assert len(result) == 2
        assert result[0]["query_text"] == "Best AI content brief tool?"

    def test_strips_markdown_fences(self, app):
        payload = "```json\n" + json.dumps({"queries": [{"query_text": "test query", "intent": None}]}) + "\n```"
        agent = QueryDiscoveryAgent(client=_fake_client(payload))
        with app.app_context():
            result = agent.run(PROFILE)
        assert result[0]["query_text"] == "test query"

    def test_raises_on_missing_queries_key(self, app):
        agent = QueryDiscoveryAgent(client=_fake_client(json.dumps({"foo": "bar"})))
        with app.app_context(), pytest.raises(AgentError):
            agent.run(PROFILE)

    def test_raises_on_unparseable_json_after_retry(self, app):
        client = _fake_client("not json at all, sorry")
        agent = QueryDiscoveryAgent(client=client)
        with app.app_context(), pytest.raises(AgentError):
            agent.run(PROFILE)


class TestVisibilityScoringAgent:
    def test_computes_score_when_not_visible(self, app):
        payload = json.dumps({"domain_visible": False, "visibility_position": None})
        agent = VisibilityScoringAgent(client=_fake_client(payload))
        with app.app_context():
            result = agent.run("What is the best SEO tool?", PROFILE)
        assert result["domain_visible"] is False
        assert result["visibility_status"] == "not_visible"
        assert 0.0 <= result["opportunity_score"] <= 1.0

    def test_visible_domain_lowers_opportunity(self, app):
        visible_payload = json.dumps({"domain_visible": True, "visibility_position": 2})
        not_visible_payload = json.dumps({"domain_visible": False, "visibility_position": None})

        agent_visible = VisibilityScoringAgent(client=_fake_client(visible_payload))
        agent_not_visible = VisibilityScoringAgent(client=_fake_client(not_visible_payload))

        with app.app_context():
            r_visible = agent_visible.run("best seo content tool", PROFILE)
            r_not_visible = agent_not_visible.run("best seo content tool", PROFILE)

        assert r_visible["opportunity_score"] < r_not_visible["opportunity_score"]


class TestContentRecommendationAgent:
    def test_generates_recommendations_for_gap_queries(self, app):
        gap_queries = [
            {"query_uuid": "q1", "query_text": "best ai seo brief tool", "opportunity_score": 0.8},
        ]
        payload = json.dumps({"recommendations": [
            {
                "query_index": 0, "content_type": "blog_post", "title": "Best AI SEO Brief Tools",
                "rationale": "closes the gap", "target_keywords": ["ai brief tool"], "priority": "high",
            }
        ]})
        agent = ContentRecommendationAgent(client=_fake_client(payload))
        with app.app_context():
            result = agent.run(PROFILE, gap_queries)
        assert len(result) == 1
        assert result[0]["query_uuid"] == "q1"

    def test_empty_gap_queries_returns_empty_list_without_calling_llm(self, app):
        agent = ContentRecommendationAgent(client=_fake_client("{}"))
        with app.app_context():
            result = agent.run(PROFILE, [])
        assert result == []

    def test_drops_recommendations_with_invalid_query_index(self, app):
        gap_queries = [{"query_uuid": "q1", "query_text": "x", "opportunity_score": 0.5}]
        payload = json.dumps({"recommendations": [
            {"query_index": 99, "content_type": "blog_post", "title": "t", "rationale": "r", "target_keywords": [], "priority": "high"},
        ]})
        agent = ContentRecommendationAgent(client=_fake_client(payload))
        with app.app_context(), pytest.raises(AgentError):
            agent.run(PROFILE, gap_queries)


class TestScoringUtils:
    def test_classify_intent_comparison(self):
        assert classify_intent("Frase vs Surfer SEO") == "comparison"

    def test_classify_intent_best_of(self):
        assert classify_intent("What is the best SEO tool?") == "best_of"

    def test_classify_intent_informational_default(self):
        assert classify_intent("How does keyword research work?") == "informational"

    def test_opportunity_score_bounded(self):
        score = compute_opportunity_score(50000, 10, False, "best seo tool")
        assert 0.0 <= score <= 1.0

    def test_opportunity_score_higher_when_not_visible(self):
        visible = compute_opportunity_score(1000, 50, True, "best seo tool")
        not_visible = compute_opportunity_score(1000, 50, False, "best seo tool")
        assert not_visible > visible
