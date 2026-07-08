# AI Visibility Intelligence API (Task 1 — Backend)

A Flask REST API with a 3-agent AI pipeline that discovers AI-search queries for a business,
scores them for visibility opportunity, and generates content recommendations.

## Stack

- Flask 3 (app factory pattern) + Flask-SQLAlchemy + Flask-Migrate (Alembic)
- SQLite by default (swap `DATABASE_URL` for Postgres — no code changes needed)
- Anthropic Claude (`claude-sonnet-4-6`) for all three agents
- Flask-CORS, python-dotenv, pytest

## Setup (local, <5 min)

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY

export FLASK_APP=run.py
flask db upgrade      # applies migrations/versions/*.py, creates dev.db

python run.py          # runs on http://localhost:5000
```

Health check: `GET http://localhost:5000/health` → `{"status": "ok"}`

## Setup (Docker)

```bash
cd backend
cp .env.example .env   # set ANTHROPIC_API_KEY
docker compose up --build
```

## Tests

```bash
pytest tests/ -v
```

14 unit tests cover all three agents' JSON parsing/validation/fallback logic and the opportunity
score formula, all against **mocked** LLM responses (no API key or network calls required to run
the test suite).

## Architecture decisions

**App factory + blueprints.** `create_app()` in `app/__init__.py` wires config, extensions
(`db`, `migrate`, `cors`), error handlers, and two blueprints (`profiles`, `queries`). This keeps
the app importable/testable without side effects at import time (needed for both `flask db` CLI
commands and pytest fixtures that spin up isolated app instances).

**Agent separation.** Each agent (`app/agents/discovery.py`, `scoring.py`, `recommendation.py`)
is a small class with exactly one public method, `run()`, and inherits shared LLM-call/JSON-parsing
plumbing from `BaseAgent`. This means:
- Agents are unit-testable in isolation by injecting a mocked Anthropic client (`agent =
  QueryDiscoveryAgent(client=fake_client)`), which is exactly what `tests/test_agents.py` does.
- No agent holds mutable shared state — the orchestrator (`app/services/pipeline.py`) instantiates
  fresh agents per pipeline run.

**Orchestrator + failure isolation.** `PipelineOrchestrator.run()` executes Agent 1 → Agent 2 →
Agent 3 in sequence:
- If Agent 1 (discovery) fails outright, the whole run is marked `failed` and nothing further runs
  — there's nothing to score without queries.
- Agent 2 (scoring) runs **per query**, in a loop. If scoring a single query throws, that query is
  logged and skipped; the rest continue. The run only fails entirely if *zero* queries could be scored.
- If Agent 3 (recommendations) fails, the run is marked `partial` rather than `failed` — discovery
  and scoring results are still valid and persisted, only the recommendations step is missing.

**JSON robustness.** Every agent prompt explicitly defines the required JSON schema and instructs
"no markdown fences, no prose." `BaseAgent._parse_json()` still defensively strips code fences and
attempts to locate the first valid `{...}`/`[...]` block if raw parsing fails. If that also fails,
one repair round-trip is attempted (asking the model to fix its own broken JSON) before raising a
typed `AgentError`, which the orchestrator catches per-agent as described above. The pipeline never
crashes the process on malformed LLM output.

**Consistent error format.** All errors (validation, 404s, agent failures) go through
`app/utils/errors.py::APIError` / Flask error handlers and return:
```json
{"error": {"message": "...", "status_code": 422, "details": {...}}}
```

## Model selection rationale

Claude (`claude-sonnet-4-6`) is used for all three agents. Rationale:
- **Discovery & recommendations** are open-ended generative tasks where Claude's instruction
  adherence for "return ONLY JSON matching this schema" is strong, which matters a lot here since
  the whole pipeline depends on parseable output.
- **Scoring** is a lightweight, high-volume call (once per discovered query, ~15-20 calls per
  pipeline run), so a fast, cheap model matters. Since this is one pipeline (not mixing providers)
  I kept a single provider (Claude) for operational simplicity, but the code is structured so
  swapping the scoring agent to a cheaper/faster model (or a different provider) is a one-line
  change in `Config.ANTHROPIC_MODEL` / `BaseAgent._get_model()` — you could point `scoring.py` at
  `claude-haiku-4-5` independently of the other two agents if cost/latency became a concern at scale.

## Opportunity score formula

`app/utils/scoring.py::compute_opportunity_score()`. Each of four factors is normalized to `[0,1]`
before weighting, so the formula is stable regardless of the raw scale of any one input:

| Factor | Weight | Reasoning |
|---|---|---|
| Search volume (normalized against the batch's max volume) | 35% | Bigger audience = bigger opportunity if captured |
| Inverse competitive difficulty | 25% | Easier queries are more realistically capturable in the near term |
| Visibility gap (1.0 if not visible, 0.15 if already visible) | 25% | Not appearing at all is the core "gap" this product measures; some residual opportunity remains even when visible (e.g. improving rank/position) |
| Commercial intent (comparison > best-of > transactional > informational) | 15% | Comparison/best-of queries convert into buying decisions more directly than pure informational queries |

Final score = `0.35·volume_norm + 0.25·difficulty_norm + 0.25·visibility_gap + 0.15·intent_norm`,
clamped to `[0, 1]`.

## Search volume / difficulty data — honest tradeoff

The assessment asks for real third-party search data (e.g. DataForSEO). I did not have paid
DataForSEO credentials available during this assessment, so `app/utils/scoring.py::estimate_query_metrics()`
is written as a single seam:

- If `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` are set, it calls `fetch_dataforseo_metrics()`
  (stubbed — the HTTP call itself isn't implemented, since I couldn't verify it against a real
  account, but the integration point and fallback behavior are).
- Otherwise, it falls back to a **deterministic** heuristic (hash-seeded from the query text, not
  random) so opportunity scores are stable across pipeline reruns and rechecks, and the app is
  fully runnable/demoable without any paid API key beyond Anthropic's.

This is called out here rather than silently faked so it's clear what's real (LLM-driven discovery,
scoring reasoning, and recommendations) vs. simulated (volume/difficulty numbers) in this build.

## Schema decisions

- All primary keys are UUID strings (not auto-increment ints) so `profile_uuid` / `query_uuid` /
  etc. are safe to expose directly in the API and don't leak row counts.
- `PipelineRun` is a first-class table (not just a status flag on `BusinessProfile`) so pipeline
  history is queryable (`GET /profiles/{uuid}/runs`) — needed for the frontend's Pipeline Run
  History view.
- `DiscoveredQuery.run_uuid` and `ContentRecommendation.run_uuid` link results back to the run that
  produced them, so a `recheck` (which doesn't create a new run) can update a query in place while
  still being attributable to its original discovery run.
- `competitors` and `target_keywords` are stored as native JSON columns rather than a separate
  join table — they're small, read-mostly, always-fetched-with-parent lists, so normalizing them
  would add join overhead with no real query benefit at this scale.

## API endpoints implemented

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/profiles` | Create profile |
| GET | `/api/v1/profiles` | List all profiles + summary stats (used by frontend Dashboard) |
| GET | `/api/v1/profiles/{uuid}` | Profile + stats |
| POST | `/api/v1/profiles/{uuid}/run` | Trigger full pipeline (synchronous) |
| GET | `/api/v1/profiles/{uuid}/runs` | Pipeline run history |
| GET | `/api/v1/profiles/{uuid}/queries` | Filter by `min_score`, `status`, paginated |
| GET | `/api/v1/profiles/{uuid}/recommendations` | All recommendations for profile |
| POST | `/api/v1/queries/{uuid}/recheck` | Re-run Agent 2 for one query |

## Tradeoffs / what I'd do with more time

- **Synchronous pipeline execution.** Per the assessment's performance note this is explicitly
  acceptable, but a production version would move this to Celery + Redis with a status-polling
  endpoint (`GET /profiles/{uuid}/runs/{run_uuid}`), which the frontend already polls for anyway.
- **No auth layer**, per spec ("out of scope").
- **No rate limiting** on `/run` — would add `Flask-Limiter` in production given each call is
  several paid LLM requests.
- **DataForSEO integration is stubbed**, not live — see "Search volume / difficulty data" above.
- Structured logging currently uses stdlib `logging`, not correlation-ID-per-run — the `run.uuid`
  is already threaded through every log line's context and would be trivial to formalize with
  `structlog` if needed.

## AI tools used

Claude (via this assessment's own workflow) was used to scaffold the Flask app structure, write
the agent prompts, and generate the initial test suite, which I then reviewed, ran, and fixed
(e.g. a real bug where a SQLAlchemy backref named `query` shadowed `Model.query` — caught by
actually running the end-to-end pipeline test, not just reading the code).
