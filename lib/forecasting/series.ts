import type { Order } from "../data/types";
import { monthsBetween, toMonth, toWeek, weeksBetween } from "../analytics/dateBuckets";
import type { ForecastPlanInput } from "../ai/schemas";

export interface BuiltSeries {
  labels: string[];
  values: number[];
  /** Average delivery days computed over the rows that compose the series, used for lead-time estimation. */
  avg_delivery_days: number;
  rows_used: number;
}

/**
 * Aggregate orders into a contiguous time series matching the forecast plan's target.
 * Missing buckets are filled with 0 so the series is regularly spaced.
 */
export function buildSeries(orders: Order[], plan: ForecastPlanInput): BuiltSeries {
  const filtered = orders.filter((o) => {
    if (plan.target === "category_orders" || plan.target === "category_revenue") {
      if (!plan.category) return false;
      return o.product_category.toLowerCase() === plan.category.toLowerCase();
    }
    return true;
  });

  if (filtered.length === 0) {
    return { labels: [], values: [], avg_delivery_days: 0, rows_used: 0 };
  }

  // Determine date range from the data (not the plan)
  const minDate = filtered.reduce((a, b) => (a.order_date < b.order_date ? a : b)).order_date;
  const maxDate = filtered.reduce((a, b) => (a.order_date > b.order_date ? a : b)).order_date;

  const labels =
    plan.granularity === "week" ? weeksBetween(minDate, maxDate) : monthsBetween(minDate, maxDate);
  const idx = new Map<string, number>(labels.map((l, i) => [l, i]));
  const values = new Array<number>(labels.length).fill(0);

  for (const o of filtered) {
    const bucket = plan.granularity === "week" ? toWeek(o.order_date) : toMonth(o.order_date);
    const i = idx.get(bucket);
    if (i === undefined) continue;
    if (plan.target === "category_revenue") {
      values[i] += o.order_value_usd;
    } else {
      values[i] += 1;
    }
  }

  // Avg delivery days from the same orders (only those with a delivery_date)
  let dd_sum = 0;
  let dd_n = 0;
  for (const o of filtered) {
    if (o.delivery_days !== null) {
      dd_sum += o.delivery_days;
      dd_n++;
    }
  }
  const avg_delivery_days = dd_n === 0 ? 0 : dd_sum / dd_n;

  return { labels, values, avg_delivery_days, rows_used: filtered.length };
}
