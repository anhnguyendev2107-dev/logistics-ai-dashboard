import { describe, expect, it } from "vitest";
import { loadOrders } from "@/lib/data/loader";
import { computeKpis } from "@/lib/analytics/metrics";
import { runQuery } from "@/lib/analytics/queryExecutor";

/**
 * Ground-truth KPIs come from `scripts/verify_kpis.py` — pandas computation
 * over the same CSV. The TS implementation must match exactly.
 */
const GROUND_TRUTH = {
  total_orders: 400,
  delivered: 304,
  delayed: 55,
  in_transit: 27,
  exception: 11,
  canceled: 3,
  delay_rate: 55 / 359,
  on_time_rate: 304 / 359,
  avg_delivery_days_n: 370,
  avg_delivery_days: 3.82973, // ±1e-4
};

describe("computeKpis matches ground-truth", () => {
  const orders = loadOrders();
  const kpi = computeKpis(orders);

  it("counts all order statuses", () => {
    expect(kpi.total_orders).toBe(GROUND_TRUTH.total_orders);
    expect(kpi.delivered).toBe(GROUND_TRUTH.delivered);
    expect(kpi.delayed).toBe(GROUND_TRUTH.delayed);
    expect(kpi.in_transit).toBe(GROUND_TRUTH.in_transit);
    expect(kpi.exception).toBe(GROUND_TRUTH.exception);
    expect(kpi.canceled).toBe(GROUND_TRUTH.canceled);
  });

  it("delay_rate uses terminal denominator (delivered ∪ delayed)", () => {
    expect(kpi.delay_rate).toBeCloseTo(GROUND_TRUTH.delay_rate, 6);
    expect(kpi.on_time_rate).toBeCloseTo(GROUND_TRUTH.on_time_rate, 6);
    expect(kpi.delay_rate + kpi.on_time_rate).toBeCloseTo(1, 6);
  });

  it("avg_delivery_days excludes rows with null delivery_date", () => {
    expect(kpi.avg_delivery_days_n).toBe(GROUND_TRUTH.avg_delivery_days_n);
    expect(kpi.avg_delivery_days).toBeCloseTo(GROUND_TRUTH.avg_delivery_days, 4);
  });
});

describe("runQuery: delay_rate by carrier", () => {
  const orders = loadOrders();

  it("identifies GLS as the highest-delay carrier", () => {
    const result = runQuery(orders, {
      metric: "delay_rate",
      dimension: "carrier",
      filters: {},
      sort: "desc",
      limit: 10,
      chart_hint: "bar",
    });
    expect(result.rows[0].x).toBe("GLS");
    expect(result.rows[0].y).toBeCloseTo(2 / 7, 4);
  });

  it("DPD has zero delay rate", () => {
    const result = runQuery(orders, {
      metric: "delay_rate",
      dimension: "carrier",
      filters: {},
      sort: "asc",
      limit: 1,
      chart_hint: "bar",
    });
    expect(result.rows[0].x).toBe("DPD");
    expect(result.rows[0].y).toBe(0);
  });
});

describe("runQuery: filters and time dimensions", () => {
  const orders = loadOrders();

  it("filters by date range", () => {
    const result = runQuery(orders, {
      metric: "count",
      dimension: null,
      filters: { date_from: "2025-01-01", date_to: "2025-01-31" },
      sort: "desc",
      limit: 1,
      chart_hint: "kpi",
    });
    // Jan = first 4 ISO weeks (~16 + 28 + 15 + 9 = 68) plus tail of week 5
    expect(result.rows[0].y).toBeGreaterThan(60);
    expect(result.rows[0].y).toBeLessThan(80);
  });

  it("date_week dimension sorts chronologically, not by metric", () => {
    const result = runQuery(orders, {
      metric: "count",
      dimension: "date_week",
      filters: { date_from: "2025-01-01", date_to: "2025-01-31" },
      sort: "desc", // ignored for time dims
      limit: 100,
      chart_hint: "line",
    });
    for (let i = 1; i < result.rows.length; i++) {
      expect(result.rows[i].x.localeCompare(result.rows[i - 1].x)).toBeGreaterThan(0);
    }
  });
});
