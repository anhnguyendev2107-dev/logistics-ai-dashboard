import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Database,
  Zap,
  MemoryStick,
  TrendingUp,
  ShieldCheck,
  Activity,
  DollarSign,
  Bell,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TableOfContents, type TocGroup } from "@/components/TableOfContents";

export const metadata = {
  title: "Architecture · Logos",
};

const DATA_FLOW = `
%%{init: {"flowchart": {"curve": "basis", "padding": 18, "nodeSpacing": 40, "rankSpacing": 55}} }%%
flowchart TB
  U(["User question"]):::user

  subgraph orchestration ["⌬ &nbsp;AI Orchestration"]
    direction TB
    Cache[("LRU<br/>cache")]:::data
    Router("Router<br/><b>LLM</b>"):::ai
    Plan{{"Typed plan<br/><i>QueryPlan · ForecastPlan</i><br/><i>Clarify · Decline</i>"}}:::ai
    Insight("Insight<br/><b>LLM</b>"):::ai
  end

  subgraph executor ["⚙ &nbsp;Deterministic executor"]
    direction TB
    Exec("filter · group · agg"):::compute
    FC("forecast methods<br/><i>MA · linear · Holt</i>"):::compute
    Score("MAPE backtest"):::compute
    Inv("inventory ROP"):::compute
  end

  CSV[("mock_logistics_data.csv<br/><i>400 rows · read-only</i>")]:::data

  Result[/"Result + metadata"/]:::result

  subgraph rendering ["◧ &nbsp;UI rendering"]
    direction LR
    Chart("Chart"):::ui
    Panel("Explain panel"):::ui
  end

  U ==> Cache
  Cache ==>|miss| Router
  Cache -.->|hit| Chart
  Router ==> Plan
  Plan ==>|run_query| Exec
  Plan ==>|run_forecast| FC
  CSV --> Exec
  CSV --> FC
  FC --> Score --> Inv
  Exec ==> Result
  Inv ==> Result
  Result ==> Insight
  Insight --> Chart
  Result ==> Chart
  Plan --> Panel
  Result --> Panel

  classDef user fill:#fef3c7,stroke:#f59e0b,color:#78350f,stroke-width:2px,font-weight:600
  classDef ai fill:#e0e7ff,stroke:#6366f1,color:#312e81,stroke-width:2px
  classDef compute fill:#d1fae5,stroke:#10b981,color:#064e3b,stroke-width:2px
  classDef data fill:#f1f5f9,stroke:#64748b,color:#1e293b,stroke-width:2px
  classDef ui fill:#fae8ff,stroke:#a855f7,color:#581c87,stroke-width:2px
  classDef result fill:#fff7ed,stroke:#f97316,color:#7c2d12,stroke-width:2px,font-weight:600

  style orchestration fill:#eef2ff,stroke:#c7d2fe,color:#3730a3,stroke-dasharray: 4 3
  style executor fill:#ecfdf5,stroke:#a7f3d0,color:#047857,stroke-dasharray: 4 3
  style rendering fill:#fdf4ff,stroke:#f5d0fe,color:#86198f,stroke-dasharray: 4 3
`.trim();

const PROVIDER_POOL = `
%%{init: {"flowchart": {"curve": "basis", "padding": 16, "nodeSpacing": 35, "rankSpacing": 60}} }%%
flowchart LR
  Q(["question<br/>or plan + result"]):::input

  subgraph google ["Google Gemini"]
    direction TB
    G1["key #1"]:::gem
    G2["key #2"]:::gem
    G3["key #N"]:::gem
    G1 -.->|fail| G2
    G2 -.->|fail| G3
  end

  subgraph anthropic ["Anthropic Claude"]
    direction TB
    A1["key #1"]:::ant
    A2["key #N"]:::ant
    A1 -.->|fail| A2
  end

  subgraph openai ["OpenAI"]
    direction TB
    O1["key #1"]:::oai
    O2["key #N"]:::oai
    O1 -.->|fail| O2
  end

  Out([typed JSON]):::ok
  Err([all keys exhausted]):::err

  Q ==> G1
  G3 -.->|all fail| A1
  A2 -.->|all fail| O1

  G1 -.->|ok| Out
  G2 -.->|ok| Out
  G3 -.->|ok| Out
  A1 -.->|ok| Out
  A2 -.->|ok| Out
  O1 -.->|ok| Out
  O2 -.->|ok| Out
  O2 -.->|fail| Err

  classDef input fill:#fef3c7,stroke:#f59e0b,color:#78350f,stroke-width:2px,font-weight:600
  classDef gem fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a,stroke-width:2px
  classDef ant fill:#fef3c7,stroke:#f59e0b,color:#78350f,stroke-width:2px
  classDef oai fill:#d1fae5,stroke:#10b981,color:#064e3b,stroke-width:2px
  classDef ok fill:#dcfce7,stroke:#16a34a,color:#14532d,stroke-width:2.5px,font-weight:700
  classDef err fill:#fee2e2,stroke:#ef4444,color:#7f1d1d,stroke-width:2px

  style google fill:#eff6ff,stroke:#bfdbfe,color:#1e40af
  style anthropic fill:#fffbeb,stroke:#fde68a,color:#92400e
  style openai fill:#ecfdf5,stroke:#a7f3d0,color:#047857
`.trim();

const LAYERS = `
%%{init: {"flowchart": {"curve": "basis", "padding": 16, "nodeSpacing": 30, "rankSpacing": 50}} }%%
flowchart TB
  subgraph app ["▣ &nbsp;app/ · Next.js routes"]
    direction LR
    Dash["/  · dashboard<br/><i>RSC · KPIs + 4 charts</i>"]:::route
    Chat["/chat<br/><i>NL interface · history</i>"]:::route
    Arch["/architecture<br/><i>this page</i>"]:::route
    Ask["/api/ask"]:::api
    Health["/api/health"]:::api
  end

  subgraph lib ["⚙ &nbsp;lib/ · pure logic"]
    direction LR
    Data["data<br/><i>loader · types</i>"]:::core
    Analytics["analytics<br/><i>queryExecutor · metrics</i>"]:::core
    Forecast["forecasting<br/><i>methods · backtest · inventory</i>"]:::core
    AIlib["ai<br/><i>router · schemas · prompts · insight</i>"]:::core
    CacheLib["cache<br/><i>LRU</i>"]:::core
  end

  subgraph comps ["◧ &nbsp;components/ · UI"]
    direction LR
    Kpi[KpiCard]:::ui
    CR[ChartRenderer]:::ui
    Stack[StackedDeliveryChart]:::ui
    CP[ChatPanel]:::ui
    Exp[ExplainPanel]:::ui
    Hist[HistorySidebar]:::ui
    Merm[MermaidDiagram]:::ui
  end

  subgraph tests ["✓ &nbsp;tests/ + scripts/"]
    direction LR
    V["Vitest<br/><i>13 unit tests</i>"]:::test
    Py["verify_kpis.py<br/><i>pandas ground-truth</i>"]:::test
  end

  Dash --> Kpi
  Dash --> CR
  Dash --> Stack
  Dash --> Analytics
  Chat --> CP
  Chat --> Hist
  Chat --> Exp
  Chat --> Ask
  Arch --> Merm
  Ask --> AIlib
  AIlib --> Analytics
  AIlib --> Forecast
  AIlib --> CacheLib
  Analytics --> Data
  Forecast --> Data
  Health --> AIlib

  V --> Analytics
  V --> Forecast
  Py -.->|verifies| Analytics

  classDef route fill:#fae8ff,stroke:#a855f7,color:#581c87,stroke-width:2px,font-weight:600
  classDef api fill:#fef3c7,stroke:#f59e0b,color:#78350f,stroke-width:2px,font-weight:600
  classDef core fill:#e0e7ff,stroke:#6366f1,color:#312e81,stroke-width:2px
  classDef ui fill:#fce7f3,stroke:#ec4899,color:#831843,stroke-width:2px
  classDef test fill:#d1fae5,stroke:#10b981,color:#064e3b,stroke-width:2px

  style app fill:#fdf4ff,stroke:#f5d0fe,color:#86198f,stroke-dasharray: 4 3
  style lib fill:#eef2ff,stroke:#c7d2fe,color:#3730a3,stroke-dasharray: 4 3
  style comps fill:#fdf2f8,stroke:#fbcfe8,color:#9d174d,stroke-dasharray: 4 3
  style tests fill:#ecfdf5,stroke:#a7f3d0,color:#047857,stroke-dasharray: 4 3
`.trim();

export default function ArchitecturePage() {
  const tocGroups: TocGroup[] = [
    {
      label: "Overview",
      items: [{ id: "intro", label: "Introduction", level: 1 }],
    },
    {
      label: "System diagrams",
      items: [
        { id: "data-flow", label: "End-to-end data flow", level: 1 },
        { id: "provider-pool", label: "Provider pool with fallback", level: 1 },
        { id: "code-layers", label: "Code layer separation", level: 1 },
      ],
    },
    {
      label: "Future implementation",
      items: [
        { id: "production", label: "If this ran in production", level: 1 },
        ...ROADMAP.map((r) => ({
          id: roadmapId(r.title),
          label: r.title,
          level: 2 as const,
        })),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto flex w-full max-w-7xl gap-8 px-6">
        {/* Left sidebar — docs nav */}
        <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 flex-col self-start py-8 lg:flex">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm transition-transform group-hover:scale-105">
                <Boxes className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Logos<span className="text-zinc-400 dark:text-zinc-500"> · docs</span>
              </span>
            </Link>
            <ThemeToggle />
          </div>
          <Link
            href="/"
            className="mb-6 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to dashboard
          </Link>
          <div className="flex-1 overflow-y-auto pr-2">
            <TableOfContents groups={tocGroups} />
          </div>
          <div className="border-t border-zinc-200/60 pt-3 text-[10px] text-zinc-400 dark:border-zinc-800/60">
            Architecture v1 · {new Date().getFullYear()}
          </div>
        </aside>

        {/* Mobile floating utility (sidebar hidden on small screens) */}
        <div className="fixed right-4 top-4 z-30 flex items-center gap-2 lg:hidden">
          <Link
            href="/"
            title="Back to dashboard"
            className="flex h-8 items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/80 px-3 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <ThemeToggle />
        </div>

        {/* Main content */}
        <main className="min-w-0 flex-1 py-12">
          <section id="intro" className="mb-12 scroll-mt-8">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              Architecture overview
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Architecture
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              Live, zoomable Mermaid diagrams of how a user question travels through the LLM
              router, the deterministic executor, and back to the UI. The LLM never produces
              numbers — it only produces structured intent that a typed Zod plan validates.
            </p>
          </section>

          <Section
            id="data-flow"
            title="End-to-end data flow"
            subtitle="From user prompt to rendered chart with insight commentary."
          >
            <MermaidDiagram chart={DATA_FLOW} />
          </Section>

          <Section
            id="provider-pool"
            title="Provider pool with fallback"
            subtitle="Comma-separated keys per provider, tried left-to-right, every error logs to the response."
          >
            <MermaidDiagram chart={PROVIDER_POOL} />
          </Section>

          <Section
            id="code-layers"
            title="Code layer separation"
            subtitle="Routes, pure logic, UI, and tests — each layer depends only on the one below."
          >
            <MermaidDiagram chart={LAYERS} />
          </Section>

          <ProductionRoadmap />

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/60 pt-6 text-xs text-zinc-400 dark:border-zinc-800/60">
            <span>
              Diagrams rendered with{" "}
              <a href="https://mermaid.js.org/" className="underline">
                mermaid
              </a>{" "}
              · zoom by{" "}
              <a
                href="https://github.com/BetterTyped/react-zoom-pan-pinch"
                className="underline"
              >
                react-zoom-pan-pinch
              </a>
            </span>
            <Link href="/" className="font-mono hover:text-zinc-600 dark:hover:text-zinc-300">
              ← Back to dashboard
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}

function roadmapId(title: string) {
  return "roadmap-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

interface RoadmapItem {
  icon: LucideIcon;
  tone: "indigo" | "emerald" | "amber" | "rose" | "violet" | "cyan" | "lime" | "orange";
  title: string;
  current: string;
  future: string;
  stack: string;
}

const ROADMAP: RoadmapItem[] = [
  {
    icon: Database,
    tone: "indigo",
    title: "Persistent data layer",
    current: "CSV parsed in memory at module load · 400 rows.",
    future:
      "Postgres + TimescaleDB hypertables for time-series KPIs. CDC from operational DB via Debezium → Kafka → ETL into the analytics warehouse. Multi-tenant with row-level security on client_id.",
    stack: "Postgres · TimescaleDB · Debezium · Kafka",
  },
  {
    icon: Zap,
    tone: "amber",
    title: "Streaming responses",
    current: "API returns full JSON after both LLM calls (~3–5s wall clock).",
    future:
      "SSE/Edge runtime. Chart appears as soon as the executor finishes (~50ms after route LLM); insight streams in token-by-token. User sees data instantly while commentary writes itself.",
    stack: "Vercel AI SDK streamText · SSE · React Suspense",
  },
  {
    icon: MemoryStick,
    tone: "violet",
    title: "Persistent multi-turn memory",
    current: "localStorage history; each question is independent (no follow-up resolution).",
    future:
      "Server-side conversation store keyed by user. Context window includes last N turns + a vector-retrieved summary of older sessions. Follow-ups like 'what about EU only?' resolve by reusing the previous plan with overrides.",
    stack: "Postgres + pgvector · embedding cache · prompt caching",
  },
  {
    icon: TrendingUp,
    tone: "emerald",
    title: "Production forecasting",
    current: "3 hand-rolled methods, backtested on 25% holdout, refit nightly per request.",
    future:
      "Prophet + ARIMA + LightGBM ensemble per category. Scheduled batch retraining (Airflow DAG nightly). Drift detection on residual distribution — page on-call if MAPE jumps >2× baseline. Cross-validation grid search for hyperparameters.",
    stack: "Prophet · statsmodels · Airflow · MLflow",
  },
  {
    icon: ShieldCheck,
    tone: "cyan",
    title: "Auth, RBAC & audit",
    current: "No auth — anyone with the URL can query.",
    future:
      "SSO via SAML/OIDC. Role-scoped data access (regional managers see only their region; finance sees revenue but not warehouse). Every query/forecast call logged with user, plan, latency, cost — searchable for incident review.",
    stack: "Auth.js · Clerk / WorkOS · OPA policies · audit log table",
  },
  {
    icon: Activity,
    tone: "rose",
    title: "Observability & evals",
    current: "Provider name + latency + attempts in the response. No traces, no eval suite.",
    future:
      "OpenTelemetry traces with LLM-aware spans (provider, tokens, cost). Sentry for client errors. Continuous eval suite — 50 golden Q→plan pairs runs on every prompt change, gates merge if accuracy drops. Per-deployment LLM cost dashboard.",
    stack: "OpenTelemetry · Datadog/Honeycomb · LangSmith · Sentry",
  },
  {
    icon: DollarSign,
    tone: "lime",
    title: "Cost control",
    current: "LRU cache on identical questions. Provider pool tries cheap-first.",
    future:
      "Anthropic prompt caching on the system prompt + tool schema (~80% token savings). Model routing: route simple queries to Haiku/Flash, complex to Sonnet/Pro. Per-tenant budget caps with friendly throttle. Embedding cache for semantic dedup of paraphrased questions.",
    stack: "Prompt caching · model router · semantic cache · per-tenant budgets",
  },
  {
    icon: Bell,
    tone: "orange",
    title: "Real-time alerts & monitoring",
    current: "Pull model — user asks, system answers.",
    future:
      "Push model. Background workers run anomaly detection on weekly KPIs (z-score + STL decomposition). When delay rate spikes >2σ for any carrier, post to Slack with the chart embedded + auto-generated explanation. User-defined alerts via the chat: 'tell me when DHL delay rate goes above 10%'.",
    stack: "Cron · STL decomposition · Slack/email · saved alert table",
  },
];

const TONE_CLASSES: Record<RoadmapItem["tone"], { bg: string; icon: string; ring: string }> = {
  indigo: {
    bg: "bg-indigo-50/60 dark:bg-indigo-950/30",
    icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300",
    ring: "border-indigo-200/60 dark:border-indigo-800/40",
  },
  emerald: {
    bg: "bg-emerald-50/60 dark:bg-emerald-950/30",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300",
    ring: "border-emerald-200/60 dark:border-emerald-800/40",
  },
  amber: {
    bg: "bg-amber-50/60 dark:bg-amber-950/30",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300",
    ring: "border-amber-200/60 dark:border-amber-800/40",
  },
  rose: {
    bg: "bg-rose-50/60 dark:bg-rose-950/30",
    icon: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300",
    ring: "border-rose-200/60 dark:border-rose-800/40",
  },
  violet: {
    bg: "bg-violet-50/60 dark:bg-violet-950/30",
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300",
    ring: "border-violet-200/60 dark:border-violet-800/40",
  },
  cyan: {
    bg: "bg-cyan-50/60 dark:bg-cyan-950/30",
    icon: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-300",
    ring: "border-cyan-200/60 dark:border-cyan-800/40",
  },
  lime: {
    bg: "bg-lime-50/60 dark:bg-lime-950/30",
    icon: "bg-lime-100 text-lime-600 dark:bg-lime-900/50 dark:text-lime-300",
    ring: "border-lime-200/60 dark:border-lime-800/40",
  },
  orange: {
    bg: "bg-orange-50/60 dark:bg-orange-950/30",
    icon: "bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300",
    ring: "border-orange-200/60 dark:border-orange-800/40",
  },
};

function ProductionRoadmap() {
  return (
    <section id="production" className="mt-16 mb-10 scroll-mt-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/30">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-indigo-600 dark:text-indigo-400">
            Future implementation
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            If this ran in production
          </h2>
        </div>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
        Each card lists what the system does today vs. how it would evolve under real production
        load — concrete tooling, not vague hand-waving.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {ROADMAP.map((item) => (
          <RoadmapCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const Icon = item.icon;
  const tone = TONE_CLASSES[item.tone];
  return (
    <article
      id={roadmapId(item.title)}
      className={`group relative overflow-hidden rounded-xl border p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg scroll-mt-8 ${tone.bg} ${tone.ring}`}
    >
      <header className="mb-3 flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone.icon}`}>
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</h3>
      </header>
      <dl className="space-y-2 text-xs leading-relaxed">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
            Today
          </dt>
          <dd className="text-zinc-600 dark:text-zinc-400">{item.current}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
            In production
          </dt>
          <dd className="text-zinc-700 dark:text-zinc-300">{item.future}</dd>
        </div>
      </dl>
      <footer className="mt-3 flex flex-wrap gap-1">
        {item.stack.split(" · ").map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-zinc-200/60 bg-white/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </footer>
    </article>
  );
}
