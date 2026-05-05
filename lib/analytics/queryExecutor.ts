import type { Order } from "../data/types";
import { toDay, toMonth, toWeek } from "./dateBuckets";

/* ─────────────  Plan types  ───────────── */

export type Metric =
  | "count"
  | "sum_value"
  | "delay_rate"
  | "on_time_rate"
  | "avg_delivery_days";

export type Dimension =
  | "carrier"
  | "region"
  | "warehouse"
  | "product_category"
  | "status"
  | "destination_city"
  | "origin_city"
  | "date_day"
  | "date_week"
  | "date_month"
  | null;

export interface QueryPlan {
  metric: Metric;
  dimension: Dimension;
  filters: {
    date_from?: string;
    date_to?: string;
    carrier?: string;
    region?: string;
    product_category?: string;
    status?: string;
    warehouse?: string;
  };
  sort: "asc" | "desc";
  limit: number;
  chart_hint: "kpi" | "line" | "bar" | "stacked_bar" | "table";
}

export interface QueryResultRow {
  x: string; // dimension key (group label, or "all")
  y: number; // metric value
  count: number; // rows that contributed (for explainability)
}

export interface QueryResult {
  rows: QueryResultRow[];
  total_rows_used: number;
  plan: QueryPlan;
  filtered_sample: Order[]; // first 5 rows used, for explainability
}

/* ─────────────  Filtering  ───────────── */

function applyFilters(orders: Order[], f: QueryPlan["filters"]): Order[] {
  return orders.filter((o) => {
    if (f.date_from && o.order_date < f.date_from) return false;
    if (f.date_to && o.order_date > f.date_to) return false;
    if (f.carrier && o.carrier.toLowerCase() !== f.carrier.toLowerCase()) return false;
    if (f.region && o.region !== f.region) return false;
    if (
      f.product_category &&
      o.product_category.toLowerCase() !== f.product_category.toLowerCase()
    )
      return false;
    if (f.status && o.status !== f.status) return false;
    if (f.warehouse && o.warehouse !== f.warehouse) return false;
    return true;
  });
}

/* ─────────────  Group key  ───────────── */

function groupKey(o: Order, dim: Dimension): string {
  if (dim === null) return "all";
  switch (dim) {
    case "carrier":
      return o.carrier;
    case "region":
      return o.region;
    case "warehouse":
      return o.warehouse;
    case "product_category":
      return o.product_category;
    case "status":
      return o.status;
    case "destination_city":
      return o.destination_city;
    case "origin_city":
      return o.origin_city;
    case "date_day":
      return toDay(o.order_date);
    case "date_week":
      return toWeek(o.order_date);
    case "date_month":
      return toMonth(o.order_date);
  }
}

/* ─────────────  Metric reducers  ───────────── */

interface Bucket {
  rows: Order[];
}

function reduce(metric: Metric, bucket: Bucket): { y: number; count: number } {
  const rows = bucket.rows;
  const count = rows.length;
  switch (metric) {
    case "count":
      return { y: count, count };
    case "sum_value": {
      let s = 0;
      for (const r of rows) s += r.order_value_usd;
      return { y: s, count };
    }
    case "delay_rate": {
      let terminal = 0;
      let delayed = 0;
      for (const r of rows) {
        if (r.status === "delivered" || r.status === "delayed") {
          terminal++;
          if (r.status === "delayed") delayed++;
        }
      }
      return { y: terminal === 0 ? 0 : delayed / terminal, count: terminal };
    }
    case "on_time_rate": {
      let terminal = 0;
      let onTime = 0;
      for (const r of rows) {
        if (r.status === "delivered" || r.status === "delayed") {
          terminal++;
          if (r.status === "delivered") onTime++;
        }
      }
      return { y: terminal === 0 ? 0 : onTime / terminal, count: terminal };
    }
    case "avg_delivery_days": {
      let s = 0;
      let n = 0;
      for (const r of rows) {
        if (r.delivery_days !== null) {
          s += r.delivery_days;
          n++;
        }
      }
      return { y: n === 0 ? 0 : s / n, count: n };
    }
  }
}

/* ─────────────  Sorting + limit  ───────────── */

function sortRows(rows: QueryResultRow[], plan: QueryPlan): QueryResultRow[] {
  // For time dimensions, always sort by x (chronological) regardless of plan.sort.
  const isTime =
    plan.dimension === "date_day" ||
    plan.dimension === "date_week" ||
    plan.dimension === "date_month";

  if (isTime) {
    return [...rows].sort((a, b) => a.x.localeCompare(b.x));
  }
  const dir = plan.sort === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => (a.y - b.y) * dir);
}

/* ─────────────  Public API  ───────────── */

export function runQuery(orders: Order[], plan: QueryPlan): QueryResult {
  const filtered = applyFilters(orders, plan.filters);

  // Group
  const groups = new Map<string, Bucket>();
  for (const o of filtered) {
    const k = groupKey(o, plan.dimension);
    let b = groups.get(k);
    if (!b) {
      b = { rows: [] };
      groups.set(k, b);
    }
    b.rows.push(o);
  }

  // Reduce
  const rows: QueryResultRow[] = [];
  for (const [k, b] of groups) {
    const { y, count } = reduce(plan.metric, b);
    rows.push({ x: k, y, count });
  }

  const sorted = sortRows(rows, plan);
  const limited = sorted.slice(0, plan.limit);

  return {
    rows: limited,
    total_rows_used: filtered.length,
    plan,
    filtered_sample: filtered.slice(0, 5),
  };
}
