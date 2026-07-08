# AI Visibility Dashboard (Task 2 — Frontend)

React + TypeScript dashboard for the AI Visibility Intelligence API (Task 1).

## Stack

- React 18 (functional components + hooks) + TypeScript, built with Vite
- Tailwind CSS (no component library — hand-built components, see `src/components/common`)
- `react-router-dom` for navigation
- `recharts` for the opportunity chart

TypeScript was chosen per the assessment's "strongly preferred" note. React (over Angular) was
chosen since the backend is a plain REST API with no framework-specific coupling, and React +
hooks keeps the data-fetching/state layer (`hooks/`, `services/api.ts`) simple and explicit.

## Setup (<5 min)

```bash
cd frontend
npm install
cp .env.example .env   # points at http://localhost:5000 by default — edit if your API runs elsewhere
npm run dev             # http://localhost:5173
```

Make sure the Task 1 backend is running first (`cd ../backend && python run.py`) — the dashboard
is empty and shows connection errors otherwise.

## Build

```bash
npm run build      # tsc -b && vite build, outputs to dist/
npm run preview    # serve the production build locally
```

## Design direction

Followed the provided Figma reference closely: white surfaces on a soft lavender-gray canvas,
a single purple accent (`#6E4CF0`) for primary actions and active states, rounded cards with a
soft shadow, and a left sidebar for navigation. Typography pairs Sora (display/headings) with
Inter (body/data) — Sora's slightly geometric character gives headings a bit more presence than
Inter alone without introducing a second unrelated typeface family. Design tokens live in
`tailwind.config.js` (`ink`, `surface`, `canvas`, `primary`, `good`/`warn`/`bad` for status
semantics) so every screen pulls from the same palette rather than one-off hex values.

## Pages / screens implemented

| Route | Screen |
|---|---|
| `/` | Dashboard — profile cards with domain, industry, query count, avg opportunity, last run status |
| `/profiles/new` | Create Profile — validated form, multi-input competitors, redirects on success |
| `/profiles/:uuid` | Profile Detail — metadata, Run Pipeline button, stat cards, volume-vs-difficulty scatter chart |
| `/profiles/:uuid/queries` | Queries View — filterable (min score slider, status dropdown), paginated table, per-row Recheck |
| `/profiles/:uuid/recommendations` | Recommendations View — cards grouped by priority (High/Medium/Low) |
| `/profiles/:uuid/runs` | Pipeline Run History — table of every run with status, counts, token usage |

## Architecture

**Service layer (`src/services/api.ts`).** Every HTTP call goes through a single `request<T>()`
wrapper and the exported `api` object — no component calls `fetch` directly. Network failures and
non-2xx responses are normalized into a typed `ApiError` (message + status code + details) so every
page can handle errors uniformly.

**Hooks (`src/hooks/`).** `useProfile` / `useProfiles`, `useQueries` (filters + pagination +
recheck), and `usePipeline` (trigger + running state + result) encapsulate all data-fetching state
so page components stay thin — they wire hooks to UI, they don't manage fetch/loading/error state
themselves.

**Components (`src/components/`).** Reusable, single-responsibility: `ProfileCard`, `QueryTable`,
`OpportunityChart`, `RecommendationCard`, `PipelineStatus`, plus a `common/` module for small
shared primitives (`Spinner`, `ErrorState`, `EmptyState`, `VisibilityBadge`, `PriorityBadge`,
`OpportunityBar`) used across every page so loading/error/empty states look and behave identically
everywhere.

**Types (`src/types/index.ts`).** Mirrors the backend's response shapes exactly (profile, query,
recommendation, pipeline run, pagination), so the compiler catches drift between frontend and API
if the backend response shape ever changes.

## Real-time pipeline feedback

The backend's `/run` endpoint is synchronous (per the assessment's performance note, this is
explicitly acceptable — pipeline runs take 10-30s). `PipelineStatus` shows a spinner with a live
elapsed-seconds counter for the duration of the request, and the result banner communicates
discovered/scored/recommendation counts once the request resolves. If the backend is later moved
to async execution with a status-polling endpoint, `usePipeline` is the only place that would need
to change (poll `GET /profiles/{uuid}/runs/{run_uuid}` instead of awaiting the POST directly).

## UI/UX requirements checklist

- Responsive: sidebar collapses on narrow viewports (`md:` breakpoint), grids reflow from 3 → 2 → 1
  columns down to tablet width (768px+)
- Loading states: `Spinner` on every async view
- Error states: `ErrorState` with retry, plus inline field validation on Create Profile
- Chart: volume-vs-difficulty scatter plot (`OpportunityChart`, via Recharts) on Profile Detail
- Pipeline trigger with real-time (elapsed-time) feedback: `PipelineStatus`
- Filter/sort controls: min-score slider + status dropdown on Queries View
- Navigation: persistent left sidebar, contextual profile sub-nav appears once a profile is selected

## Tradeoffs / what I'd do with more time

- No component library was used (hand-built with Tailwind) to keep the bundle small and match the
  Figma reference exactly rather than fighting a library's defaults — with more time I'd extract
  the `common/` primitives into a proper local design-system package with Storybook stories (listed
  as a bonus item in the brief).
- No dark mode toggle or component tests were added given time constraints; the token-based Tailwind
  config makes a dark mode variant a relatively mechanical follow-up (swap `canvas`/`surface`/`ink`
  token values behind a `dark:` variant).
- The opportunity chart is a single scatter view; a production version would likely add a second
  score-distribution histogram as a toggle, per the assessment's "or similar" allowance.

## AI tools used

Claude was used to scaffold components/hooks and the Tailwind design tokens, which I then
type-checked (`tsc -b`) and built (`vite build`) to verify everything compiles cleanly end-to-end.
