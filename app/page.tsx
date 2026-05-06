import Link from "next/link";
import { Suspense } from "react";
import { Package, CheckCircle2, AlertTriangle, Truck, Clock, Sparkles } from "lucide-react";
import { buildDashboardSnapshot } from "@/lib/analytics/dashboard";
import { KpiCard } from "@/components/KpiCard";
import { QueryChart } from "@/components/ChartRenderer";
import { StackedDeliveryChart } from "@/components/StackedDeliveryChart";
import { DashboardFilters } from "@/components/DashboardFilters";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GithubIcon } from "@/components/GithubIcon";
import { Boxes } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/utils";

const REPO_URL = "https://github.com/anhnguyendev2107-dev/logistics-ai-dashboard";

export const dynamic = "force-dynamic";

interface SearchParams {
  from?: string;
  to?: string;
  region?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const snap = buildDashboardSnapshot({
    date_from: params.from,
    date_to: params.to,
    region: params.region,
  });

  return (
    <div className="min-h-screen">
      {/* Floating utility row */}
      <div className="fixed top-6 right-6 z-30 flex items-center gap-2">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          title="View source on GitHub"
          aria-label="View source on GitHub"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <GithubIcon className="h-4 w-4" />
        </a>
        <ThemeToggle />
      </div>
      <div className="fixed top-6 left-6 z-30 flex items-center gap-2">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm transition-transform group-hover:scale-105">
            <Boxes className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Logos
          </span>
        </Link>
      </div>

      <div className="hero-gradient">
        <main className="mx-auto w-full max-w-7xl px-6 pt-20 pb-12">
          {/* Hero */}
          <section className="mb-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-indigo-600 uppercase dark:text-indigo-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Operational overview
                </div>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Logistics analytics
                </h1>
                <p className="mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
                  {formatNumber(snap.filtered_count)} orders in the current view ·{" "}
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {formatPercent(snap.kpis.on_time_rate)} on-time
                  </span>{" "}
                  · avg {snap.kpis.avg_delivery_days.toFixed(2)} days to deliver.
                </p>
              </div>
              <Link
                href="/chat"
                className="group flex items-center gap-2 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition-all hover:shadow-indigo-500/40"
              >
                <Sparkles className="h-4 w-4" />
                Ask the data
                <span className="text-indigo-100 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>
          </section>

          {/* Filters */}
          <section className="mb-6">
            <Suspense fallback={null}>
              <DashboardFilters />
            </Suspense>
          </section>

          {/* KPI grid */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <KpiCard
              label="Total orders"
              value={formatNumber(snap.kpis.total_orders)}
              icon={Package}
              tone="default"
              delayMs={0}
            />
            <KpiCard
              label="Delivered"
              value={formatNumber(snap.kpis.delivered)}
              hint={`${formatPercent(snap.kpis.on_time_rate)} on-time`}
              tone="good"
              icon={CheckCircle2}
              delayMs={60}
            />
            <KpiCard
              label="Delayed"
              value={formatNumber(snap.kpis.delayed)}
              hint={`${formatPercent(snap.kpis.delay_rate)} delay rate`}
              tone="warn"
              icon={AlertTriangle}
              delayMs={120}
            />
            <KpiCard
              label="In transit"
              value={formatNumber(snap.kpis.in_transit + snap.kpis.exception)}
              hint={`${snap.kpis.in_transit} transit · ${snap.kpis.exception} exception`}
              icon={Truck}
              delayMs={180}
            />
            <KpiCard
              label="Avg delivery"
              value={`${snap.kpis.avg_delivery_days.toFixed(2)}d`}
              hint={`n = ${snap.kpis.avg_delivery_days_n} (excl. in_transit)`}
              icon={Clock}
              delayMs={240}
            />
          </section>

          {/* Charts grid */}
          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Order volume" subtitle="By ISO week" accent="indigo" delayMs={300}>
              <QueryChart result={snap.weekly_volume} />
            </ChartCard>

            <ChartCard
              title="Delivery performance"
              subtitle="By month · delivered vs delayed"
              accent="amber"
              delayMs={360}
            >
              <StackedDeliveryChart data={snap.monthly_delivery_perf} />
            </ChartCard>

            <ChartCard
              title="Delay by carrier"
              subtitle="Ranked descending"
              accent="rose"
              delayMs={420}
            >
              <QueryChart result={snap.carrier_delay} />
            </ChartCard>

            <ChartCard
              title="Volume by region"
              subtitle="Operational footprint"
              accent="emerald"
              delayMs={480}
            >
              <QueryChart result={snap.region_volume} />
            </ChartCard>
          </section>

          <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/60 pt-6 text-xs text-zinc-400 dark:border-zinc-800/60">
            <span>
              Dataset ·{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-900">
                data/mock_logistics_data.csv
              </code>{" "}
              · 2025-01-01 → 2025-12-30 · read-only
            </span>
            <span className="flex items-center gap-3">
              <Link href="/architecture" className="hover:text-zinc-600 dark:hover:text-zinc-300">
                Architecture →
              </Link>
              <Link
                href="/api/health"
                className="font-mono hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                /api/health
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <GithubIcon className="h-3 w-3" />
                Source
              </a>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

const accentBar: Record<string, string> = {
  indigo: "from-indigo-400/60 to-violet-400/60",
  amber: "from-amber-400/60 to-orange-400/60",
  rose: "from-rose-400/60 to-pink-400/60",
  emerald: "from-emerald-400/60 to-teal-400/60",
};

function ChartCard({
  title,
  subtitle,
  accent = "indigo",
  delayMs = 0,
  children,
}: {
  title: string;
  subtitle: string;
  accent?: keyof typeof accentBar;
  delayMs?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fade-up group relative overflow-hidden rounded-xl border border-zinc-200/70 bg-white/70 p-5 backdrop-blur-sm transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:hover:border-zinc-700"
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accentBar[accent]}`} />
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
      </header>
      {children}
    </div>
  );
}
