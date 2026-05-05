# Logistics AI Analytics Dashboard

An AI-powered analytics dashboard for a logistics client. The system supports three layers of intelligence over a single dataset:

- **Descriptive** — KPI cards and charts on a traditional dashboard.
- **Diagnostic** — natural-language Q&A backed by deterministic computation.
- **Predictive & Prescriptive** — demand forecasting with inventory recommendations.

> **Live demo**: _add your Vercel URL here after deploy_
>
> **Sample questions to try in `/chat`:**
> 1. _Which carrier has the highest delay rate?_
> 2. _Show weekly delivered orders for Q4 2025_
> 3. _Predict total orders for the next 4 weeks_

---

## Setup

### Local

```bash
git clone <repo>
cd logictics-agent
npm install
cp .env.local.example .env.local      # then paste at least one API key
npm run dev                            # http://localhost:3000
```

You need **at least one** of `GOOGLE_API_KEYS`, `ANTHROPIC_API_KEYS`, `OPENAI_API_KEYS` for the chat. The dashboard works without any keys.

Each variable is a **comma-separated list** so you can pool multiple keys. The router tries them left-to-right and falls back on errors.

### Docker

```bash
docker compose up --build
```

### Verify

```bash
npm test                # unit tests (analytics + forecasting)
npm run verify-kpis     # ground-truth KPI calculation in pandas
```

---

## Architecture

> User question → LLM (any provider) emits a typed `QueryPlan` JSON via tool calling → a deterministic TypeScript executor runs the plan against the in-memory dataset (parsed once at boot) → executor returns `{rows, plan, rows_used, sample}` → frontend renders the chart by inspecting the result shape → an "Explain" panel shows the plan + raw rows. **The LLM never produces numbers. It only produces structured intent.**

### Data flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────────┐     ┌────────────┐
│  User    │────▶│  /api/ask   │────▶│ AI router (pool) │────▶│ QueryPlan  │
│  prompt  │     │  Next.js    │     │ Gemini → Claude  │     │ (Zod-validated) │
└──────────┘     └─────────────┘     │ → OpenAI         │     └─────┬──────┘
                                     └──────────────────┘           │
                                                                    ▼
┌──────────────┐    ┌────────────────┐    ┌──────────────────────────┐
│ ChartRenderer│◀───│ AskResponse    │◀───│  queryExecutor / forecast│
│ + Explain    │    │ {rows, plan,   │    │  (pure TS over Order[])  │
│ drawer       │    │  rationale}    │    └──────────────────────────┘
└──────────────┘    └────────────────┘
```

### Repo layout

```
app/                   Next.js App Router
  page.tsx             dashboard (server-rendered KPIs + 4 charts)
  chat/page.tsx        natural-language chat
  api/ask/route.ts     POST { question } → AskResponse
  api/health/route.ts  diagnostic endpoint
lib/
  data/                CSV loader, Order type, REFERENCE_TODAY
  analytics/           pure functions: queryExecutor, metrics, dateBuckets, dashboard
  forecasting/         methods (MA / linear / Holt), backtest, inventory, runForecast
  ai/                  Zod schemas, system prompt, provider pool, orchestrator
  cache/               LRU cache (lru-cache, 30-min TTL)
components/            React UI (KpiCard, ChartRenderer, ChatPanel, ExplainDrawer, ...)
data/mock_logistics_data.csv
scripts/verify_kpis.py ground-truth pandas reference
tests/                 Vitest unit tests
```

### Key design decisions

| Decision | Why |
|---|---|
| **No SQL, no DB** | 400 rows. CSV → typed array at module load. A DB would be over-engineering and the spec says read-only. |
| **LLM emits structured `QueryPlan`, not SQL or numbers** | Per spec: "avoid executing raw AI-generated SQL." Every metric is computed by deterministic TS. Output is reproducible and auditable. |
| **Zod schema as contract** | Validates LLM output, gives end-to-end TypeScript types, and serves as the explainability artifact in the UI. |
| **Provider pool** | Same code path works on Gemini, Claude, or OpenAI via Vercel AI SDK. Fallback on key-level errors. Logged in the response so reviewers see which key answered. |
| **Forecast at category × {week, month} only** | 355 unique SKUs / 400 rows ⇒ 1.1 orders/SKU. SKU-level forecasts are noise. The `forecast` tool refuses SKU and offers category-level alternatives. |
| **Three forecasting methods + MAPE backtest** | Moving average, linear regression, Holt's exponential smoothing. Last 25% of the series is held out, MAPE picks the winner, and all three are surfaced in the UI. |
| **Pinned "today" = 2025-12-30** | Dataset is a fixed snapshot. Phrases like "last month" are deterministic. |
| **In-memory LRU cache** | Identical question → identical plan → identical result. Cache the entire response by normalized question. |

---

## AI approach

### How questions are interpreted

The system prompt tells the model exactly what dimensions, metrics, filters, and chart hints exist. It includes 6 few-shot examples and explicit rules:

- `delay_rate` denominator is `delivered ∪ delayed` (terminal status only).
- Time dimensions (`date_day`, `date_week`, `date_month`) imply `chart_hint: "line"`.
- "Last month" / "Q4 2025" resolve against `2025-12-30`.

### How tools are selected

Three tools are exposed to the LLM:

| Tool | Used for |
|---|---|
| `run_query` | KPIs, aggregations, rankings, time series. |
| `run_forecast` | Predictions of future demand at total or category level. |
| `clarify` | Ambiguous questions ("best carrier"?) or unsupported requests (SKU forecast). Returns 2–4 button options that the user can click; each option carries a pre-built plan, so the click triggers execution without re-prompting the LLM. |

The LLM picks **one** tool per turn; we run it; we explain it. No agentic loops.

### Explainability

Every chat answer carries an "Explain" drawer with:

- Provider that answered + latency + retry count
- The full `QueryPlan` JSON (the same object the executor consumed)
- Number of rows that contributed
- A 5-row sample of the underlying data

This is the cheapest way to make data correctness verifiable: a reviewer can manually replicate any number against the visible plan + sample.

---

## Data audit

Captured by `scripts/verify_kpis.py`; the TypeScript implementation matches every value.

| Finding | Handling |
|---|---|
| 30 of 400 rows have empty `delivery_date` (all `in_transit` or `canceled`). | Excluded from `avg_delivery_days`; counted in volume. |
| `status="delayed"` is a label in the data — there is no SLA column to derive a delay from. | Defined `delay_rate = delayed / (delivered + delayed)`. Documented in chat responses + Explain drawer. |
| 355 unique SKUs / 400 rows. | SKU forecasts not supported; `clarify` offers category-level alternatives. |
| `is_promo` rare (22 / 400). | Surfaced in raw rows; not modeled in the forecast. |
| Date range 2025-01-01 → 2025-12-30. | "Today" pinned to **2025-12-30** so relative dates are deterministic. |

### Ground-truth KPIs

```
total_orders         : 400
delivered            : 304
delayed              : 55      delay_rate = 55/359 = 15.32%
in_transit           : 27
exception            : 11
canceled             : 3
avg_delivery_days    : 3.83 (n=370)
top-3 delay carriers : GLS 28.6%, USPS 23.9%, UPS 22.4%
```

Test `tests/analytics.spec.ts` asserts every number above.

---

## Forecasting methodology

### Aggregation

Demand series are built per the requested target:

- `total_orders` × week → 52 weekly observations
- `category_orders` × month → 12 observations / category
- `category_revenue` × {week, month} → same, summing `order_value_usd`

Missing buckets are filled with 0 so the series is regularly spaced.

### Methods (hand-rolled in TypeScript, ~150 LOC total)

| Method | Strength | Weakness |
|---|---|---|
| Moving average (window=4) | Robust against noise | Lags trends |
| Linear regression on time index | Captures monotonic trend | No seasonality, no flexibility |
| Holt's linear exponential smoothing (α=0.6, β=0.2) | Adapts to changing trend | No seasonality (we have only 1 year) |

### Selection — MAPE backtest

The most recent 25% of the series is held out. Each method is fit on the train portion and forecasts the holdout. **MAPE** picks the winner; the winning method is **refit on the full series** to produce the actual forward forecast. All three results are returned so the UI can show the comparison.

### Confidence interval

`forecast ± 1.96 · σ_residual` where `σ_residual` is the standard deviation of the holdout residuals from the chosen method. Honest, not Bayesian — adequate for "basic" methods per the spec.

### Inventory recommendation

```
safety_stock  = z · σ_demand · √L           (z = 1.65 for 95% service level)
reorder_point = μ_demand · L  +  safety_stock
```

- `μ`, `σ` come from the historical demand series (no magic numbers).
- `L` (lead time, in periods) = `avg_delivery_days / period_length` — derived from the same data.

The formula and inputs are visible on every forecast response.

---

## Assumptions

- **`delay_rate`** is computed over orders with terminal status (delivered ∪ delayed). In-transit and exception orders are NOT in the denominator (we don't know yet if they'll be late).
- **Today = 2025-12-30**. Relative phrases ("last month", "next 4 weeks") use this anchor.
- **No DB**. The CSV is the dataset; everything happens in process. Treat all data as read-only.
- **Lead time = avg_delivery_days from history** for inventory math. A real system would use carrier-specific SLAs.

## Limitations

- SKU-level forecasting unsupported (data too sparse). The `clarify` tool offers category alternatives.
- No anomaly detection, no seasonality decomposition.
- No streaming responses — each chat turn is a single round-trip.
- No multi-turn memory — each question is independent.
- `delay_rate` ignores severity ("how late was it?") because the dataset has no SLA / promised delivery date.

## AI usage disclosure

Implementation was assisted by Claude Code. All architecture decisions, data audit work, forecasting math, and final code review were done by the author. The system prompt and few-shot examples in `lib/ai/prompts.ts` were authored manually based on the dataset shape.

## Future improvements

- Postgres + drizzle so the same code can serve multi-tenant scenarios.
- Streaming chat responses (Vercel AI SDK supports it via `streamObject`).
- Anomaly alerts — flag weeks with `volume > μ + 2σ` and offer drill-down.
- Carrier-specific lead times in the inventory model.
- Holt-Winters with seasonality once we have ≥18 months of history.
- Semantic synonym layer (e.g., "DHL Express" → carrier="DHL") to make filters more forgiving.

---

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Recharts · Vercel AI SDK · Zod · papaparse · lru-cache · Vitest · prettier · ESLint.
