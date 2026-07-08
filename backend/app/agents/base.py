"""
Shared base class for all three agents.
Supports: Gemini, OpenAI, and Mock mode for testing.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from flask import current_app

logger = logging.getLogger(__name__)


class AgentError(Exception):
    """Raised when an agent cannot produce usable structured output."""
    def __init__(self, agent_name: str, message: str):
        self.agent_name = agent_name
        self.message = message
        super().__init__(f"[{agent_name}] {message}")


class BaseAgent:
    agent_name = "BaseAgent"
    system_prompt: str = ""

    def __init__(self, client=None, model: str | None = None):
        self._client = client
        self._model = model
        self.last_tokens_used = 0

    # -- LLM plumbing -----------------------------------------------------

    def _get_client(self):
        """Initialize AI client - supports Mock, Gemini, and OpenAI."""
        if self._client is not None:
            return self._client
        
        # CHECK MOCK MODE FIRST - This is the key fix!
        if current_app.config.get("MOCK_AI", False):
            logger.info(f"[{self.agent_name}] Running in MOCK mode")
            return "mock"
        
        # Try Anthropic
        api_key = current_app.config.get("ANTHROPIC_API_KEY")
        if api_key and api_key != "sk-ant-demo-key":
            try:
                import anthropic
                return anthropic.Anthropic(api_key=api_key)
            except Exception as e:
                logger.warning(f"Anthropic init failed: {e}")
        
        # Try Gemini
        api_key = current_app.config.get("GOOGLE_API_KEY")
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                return genai
            except Exception as e:
                logger.warning(f"Gemini init failed: {e}")
        
        # Try OpenAI
        api_key = current_app.config.get("OPENAI_API_KEY")
        if api_key:
            try:
                import openai
                openai.api_key = api_key
                return openai
            except Exception as e:
                logger.warning(f"OpenAI init failed: {e}")
        
        # Fallback to mock if no API key is configured
        logger.warning(f"[{self.agent_name}] No API key found, falling back to MOCK mode")
        return "mock"

    def _get_model(self) -> str:
        """Get model name from config or use default."""
        if current_app.config.get("MOCK_AI", False):
            return "mock"
        return self._model or current_app.config.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")

    def _call_llm(self, user_prompt: str, max_tokens: int = 2000) -> str:
        """Call AI API or return mock response."""
        client = self._get_client()
        
        # Mock mode
        if client == "mock" or current_app.config.get("MOCK_AI", False):
            return self._mock_response(user_prompt)
        
        # Anthropic
        if hasattr(client, 'messages'):
            model = self._get_model()
            response = client.messages.create(
                model=model,
                max_tokens=max_tokens,
                system=self.system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            )
            self.last_tokens_used = getattr(response, 'usage', {}).get('total_tokens', 0)
            text_parts = [block.text for block in response.content if getattr(block, "type", None) == "text"]
            return "".join(text_parts)
        
        # Gemini
        if hasattr(client, 'GenerativeModel'):
            model = client.GenerativeModel(
                model_name=current_app.config.get("GEMINI_MODEL", "gemini-2.0-flash"),
                generation_config={
                    "max_output_tokens": max_tokens,
                    "temperature": 0.3,
                }
            )
            full_prompt = f"{self.system_prompt}\n\n{user_prompt}"
            response = model.generate_content(full_prompt)
            self.last_tokens_used = len(full_prompt.split()) + len(response.text.split())
            return response.text
        
        # OpenAI
        if hasattr(client, 'ChatCompletion'):
            response = client.ChatCompletion.create(
                model=current_app.config.get("OPENAI_MODEL", "gpt-4o"),
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=max_tokens
            )
            self.last_tokens_used = response.usage.total_tokens
            return response.choices[0].message.content
        
        raise AgentError(self.agent_name, "Unknown AI client")

    # -- Mock responses ----------------------------------------------------

    def _mock_response(self, user_prompt: str) -> str:
        """Return mock JSON responses for testing the pipeline."""
        
        # Agent 1: Query Discovery
        if "discover" in user_prompt.lower() or "generate 10" in user_prompt.lower():
            return json.dumps({
                "queries": [
                    {"query_text": "What is the best SEO content optimization tool?", "intent": "best_of"},
                    {"query_text": "How to improve SEO ranking with AI?", "intent": "informational"},
                    {"query_text": "Clearscope vs Surfer SEO - which is better?", "intent": "comparison"},
                    {"query_text": "Best AI content optimization tools for 2026", "intent": "best_of"},
                    {"query_text": "How to use AI for SEO content writing?", "intent": "informational"},
                    {"query_text": "Is Clearscope worth the money?", "intent": "transactional"},
                    {"query_text": "What are the best alternatives to Surfer SEO?", "intent": "comparison"},
                    {"query_text": "How to optimize content with Clearscope?", "intent": "informational"},
                    {"query_text": "Surfer SEO vs MarketMuse: which is better?", "intent": "comparison"},
                    {"query_text": "What is the best SEO tool for content teams?", "intent": "best_of"},
                    {"query_text": "How much does Clearscope cost?", "intent": "transactional"},
                    {"query_text": "What are the features of Clearscope?", "intent": "informational"},
                    {"query_text": "Clearscope vs Frase: which is better?", "intent": "comparison"},
                    {"query_text": "Best AI tools for content optimization", "intent": "best_of"},
                    {"query_text": "How to use Clearscope for SEO research?", "intent": "informational"}
                ]
            })
        
        # Agent 3: Content Recommendations
        elif "recommend" in user_prompt.lower() or "recommendations" in user_prompt.lower() or "gap" in user_prompt.lower():
            return json.dumps({
                "recommendations": [
                    {
                        "query_index": 0,
                        "content_type": "blog_post",
                        "title": "Best SEO Content Optimization Tools 2026",
                        "rationale": "Addresses high-volume best-of query where brand isn't visible",
                        "target_keywords": ["seo tools", "content optimization", "ai writing"],
                        "priority": "high"
                    },
                    {
                        "query_index": 2,
                        "content_type": "comparison_page",
                        "title": "Clearscope vs Surfer SEO: Which is Better?",
                        "rationale": "Comparison queries have high commercial intent",
                        "target_keywords": ["clearscope vs surfer", "seo comparison"],
                        "priority": "high"
                    },
                    {
                        "query_index": 4,
                        "content_type": "faq",
                        "title": "How to Use AI for SEO Content Writing",
                        "rationale": "Educational content attracts users in research phase",
                        "target_keywords": ["ai content writing", "seo guide"],
                        "priority": "medium"
                    },
                    {
                        "query_index": 5,
                        "content_type": "landing_page",
                        "title": "Clearscope Pricing & Features Overview",
                        "rationale": "Targets transactional queries from users ready to buy",
                        "target_keywords": ["clearscope pricing", "seo tool cost"],
                        "priority": "medium"
                    },
                    {
                        "query_index": 7,
                        "content_type": "guide",
                        "title": "How to Optimize Content with Clearscope",
                        "rationale": "Detailed tutorials help users understand the product",
                        "target_keywords": ["how to use clearscope", "content optimization"],
                        "priority": "low"
                    }
                ]
            })
        
        # Agent 2: Visibility Scoring
        else:
            return json.dumps({
                "domain_visible": False,
                "visibility_position": None,
                "reasoning": "The domain appears to be less established than competitors in this space."
            })

    # -- JSON extraction ----------------------------------------------------

    @staticmethod
    def _strip_markdown_fences(text: str) -> str:
        text = text.strip()
        fence_match = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
        if fence_match:
            return fence_match.group(1).strip()
        return text

    def _parse_json(self, raw_text: str) -> Any:
        cleaned = self._strip_markdown_fences(raw_text)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Fallback: try to locate the first {...} or [...] block
        for opener, closer in (("[", "]"), ("{", "}")):
            start = cleaned.find(opener)
            end = cleaned.rfind(closer)
            if start != -1 and end != -1 and end > start:
                candidate = cleaned[start : end + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    continue

        logger.warning("[%s] Could not parse JSON from LLM output: %.500s", self.agent_name, raw_text)
        raise AgentError(self.agent_name, "LLM returned malformed JSON that could not be recovered")

    def _call_llm_json(self, user_prompt: str, max_tokens: int = 2000) -> Any:
        raw = self._call_llm(user_prompt, max_tokens=max_tokens)
        try:
            return self._parse_json(raw)
        except AgentError:
            # One repair attempt
            repair_prompt = (
                "Your previous response could not be parsed as valid JSON. "
                "Return ONLY valid JSON (no markdown fences, no commentary) "
                f"that matches the required schema. Previous response:\n\n{raw[:3000]}"
            )
            raw_retry = self._call_llm(repair_prompt, max_tokens=max_tokens)
            return self._parse_json(raw_retry)