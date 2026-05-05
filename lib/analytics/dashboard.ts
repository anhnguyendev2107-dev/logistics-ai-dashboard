import { loadOrders } from "../data/loader";
import { computeKpis, type KpiSummary } from "./metrics";
import { runQuery, type QueryResult } from "./queryExecutor";
import { toMonth } from "./dateBuckets";

export interface DeliveryPerfPoint {
  x: string; // YYYY-MM
  delivered: number;
  delayed: number;
}

export interface DashboardSnapshot {
  filtered_count: number;
  kpis: KpiSummary;
  weekly_volume: QueryResult;
  monthly_delivery_perf: DeliveryPerfPoint[];
  carrier_delay: QueryResult;
  region_volume: QueryResult;
}

export interface DashboardFilters {
  date_from?: string;
  date_to?: string;
  region?: string;
}

/**
 * Computes everything the dashboard renders, in one pass per chart. Server-only.
 */
export function buildDashboardSnapshot(filters: DashboardFilters): DashboardSnapshot {
  const orders = loadOrders();

  // Apply filters once for KPIs (so the headline numbers reflect the filter bar)
  const filtered = orders.filter((o) => {
    if (filters.date_from && o.order_date < filters.date_from) return false;
    if (filters.date_to && o.order_date > filters.date_to) return false;
    if (filters.region && o.region !== filters.region) return false;
    return true;
  });

  const kpis = computeKpis(filtered);

  const baseFilters = {
    date_from: filters.date_from,
    date_to: filters.date_to,
    region: filters.region,
  };

  const weekly_volume = runQuery(orders, {
    metric: "count",
    dimension: "date_week",
    filters: baseFilters,
    sort: "asc",
    limit: 100,
    chart_hint: "line",
  });

  // Stacked bar: delivered vs delayed by month, on the filtered set.
  const filteredForBars = orders.filter((o) => {
    if (baseFilters.date_from && o.order_date < baseFilters.date_from) return false;
    if (baseFilters.date_to && o.order_date > baseFilters.date_to) return false;
    if (baseFilters.region && o.region !== baseFilters.region) return false;
    return true;
  });
  const perMonth = new Map<string, { delivered: number; delayed: number }>();
  for (const o of filteredForBars) {
    if (o.status !== "delivered" && o.status !== "delayed") continue;
    const m = toMonth(o.order_date);
    const cell = perMonth.get(m) ?? { delivered: 0, delayed: 0 };
    if (o.status === "delivered") cell.delivered++;
    else cell.delayed++;
    perMonth.set(m, cell);
  }
  const monthly_delivery_perf: DeliveryPerfPoint[] = [...perMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([x, v]) => ({ x, delivered: v.delivered, delayed: v.delayed }));

  const carrier_delay = runQuery(orders, {
    metric: "delay_rate",
    dimension: "carrier",
    filters: baseFilters,
    sort: "desc",
    limit: 10,
    chart_hint: "bar",
  });

  const region_volume = runQuery(orders, {
    metric: "count",
    dimension: "region",
    filters: baseFilters,
    sort: "desc",
    limit: 10,
    chart_hint: "bar",
  });

  return {
    filtered_count: filtered.length,
    kpis,
    weekly_volume,
    monthly_delivery_perf,
    carrier_delay,
    region_volume,
  };
}
