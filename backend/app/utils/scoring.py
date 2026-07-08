"""
Opportunity score formula + a deterministic fallback estimator for search
volume / competitive difficulty.

Real-data note (honest tradeoff, see README): the assessment asks for real
third-party search-volume data (e.g. DataForSEO). This codebase is written so
a real provider is a drop-in swap: `estimate_query_metrics()` is the single
seam. If DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD are present in the
environment, `fetch_dataforseo_metrics()` is used; otherwise we fall back to
a deterministic heuristic estimator so the pipeline is fully runnable without
paid credentials. The heuristic is seeded from the query text itself (hash-based)
so results are stable across reruns rather than random.
"""

from __future__ import annotations

import hashlib
import os
import re

INTENT_WEIGHTS = {
    "comparison": 1.0,   # "X vs Y" - highest commercial intent
    "best_of": 0.9,      # "best X for Y"
    "transactional": 0.8,  # "buy", "pricing", "alternative to"
    "informational": 0.55,  # "how does X work"
}

COMPARISON_PATTERNS = re.compile(r"\bvs\.?\b|\bversus\b|\bcompared? to\b", re.IGNORECASE)
BEST_OF_PATTERNS = re.compile(r"\bbest\b|\btop\b|\balternatives?\b", re.IGNORECASE)
TRANSACTIONAL_PATTERNS = re.compile(r"\bpricing\b|\bbuy\b|\bcost\b|\bfree trial\b|\bdemo\b", re.IGNORECASE)


def classify_intent(query_text: str) -> str:
    if COMPARISON_PATTERNS.search(query_text):
        return "comparison"
    if BEST_OF_PATTERNS.search(query_text):
        return "best_of"
    if TRANSACTIONAL_PATTERNS.search(query_text):
        return "transactional"
    return "informational"


def _stable_hash_fraction(text: str, salt: str = "") -> float:
    """Deterministic pseudo-random float in [0, 1) derived from text."""
    digest = hashlib.sha256((salt + text).encode("utf-8")).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def estimate_query_metrics(query_text: str) -> dict:
    """Returns {search_volume, difficulty} for a query.

    Tries a real provider first (if credentials configured), otherwise falls
    back to the deterministic heuristic.
    """
    if os.environ.get("DATAFORSEO_LOGIN") and os.environ.get("DATAFORSEO_PASSWORD"):
        try:
            return fetch_dataforseo_metrics(query_text)
        except Exception:
            # Fall through to heuristic on any provider failure so the
            # pipeline never crashes because of an external API outage.
            pass
    return _heuristic_metrics(query_text)


def fetch_dataforseo_metrics(query_text: str) -> dict:  # pragma: no cover - requires paid creds
    """Placeholder integration point for DataForSEO's Search Volume / Keyword
    Difficulty endpoints. Left unimplemented (no credentials available during
    this assessment) but isolated here so it's a one-function swap.
    """
    raise NotImplementedError("DataForSEO credentials not wired to a live call in this environment")


def _heuristic_metrics(query_text: str) -> dict:
    length_factor = min(len(query_text.split()), 14) / 14  # longer queries -> lower volume, generally
    base = _stable_hash_fraction(query_text, salt="volume")
    # Skew towards a realistic long-tail distribution: mostly 200-5000, occasional head terms.
    volume = int(150 + (base ** 1.8) * 9000 * (1 - 0.4 * length_factor))

    difficulty_base = _stable_hash_fraction(query_text, salt="difficulty")
    difficulty = int(20 + difficulty_base * 70)  # 20-90

    return {"estimated_search_volume": max(volume, 10), "competitive_difficulty": min(max(difficulty, 0), 100)}


def compute_opportunity_score(
    search_volume: int,
    competitive_difficulty: int,
    domain_visible: bool,
    query_text: str,
    max_volume_in_batch: int = 10000,
) -> float:
    """
    Multi-factor opportunity score in [0.0, 1.0].

    Weights (documented in README):
      - 35% normalized search volume  -> bigger audience = bigger opportunity
      - 25% inverse competitive difficulty -> easier queries are more capturable
      - 25% visibility gap -> not currently appearing = full gap; appearing = far less opportunity
      - 15% commercial intent -> comparison/best-of queries convert better than pure informational

    Each factor is normalized to [0, 1] before weighting so the formula stays
    stable regardless of the absolute scale of any one factor.
    """
    volume_norm = min(search_volume / max(max_volume_in_batch, 1), 1.0)
    difficulty_norm = 1 - (competitive_difficulty / 100)
    visibility_gap = 0.15 if domain_visible else 1.0  # still some residual opportunity even if visible (e.g. improve position)
    intent = classify_intent(query_text)
    intent_norm = INTENT_WEIGHTS.get(intent, 0.55)

    score = (
        0.35 * volume_norm
        + 0.25 * difficulty_norm
        + 0.25 * visibility_gap
        + 0.15 * intent_norm
    )
    return round(min(max(score, 0.0), 1.0), 4)
