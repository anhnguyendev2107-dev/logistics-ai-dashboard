import type { Order } from "../data/types";
import type { ForecastPlanInput } from "../ai/schemas";
import { buildSeries } from "./series";
import { backtestAndChoose, type BacktestSummary } from "./backtest";
import { recommendInventory, type InventoryRecommendation } from "./inventory";
import { addDays, monthsBetween, weeksBetween } from "../analytics/dateBuckets";

export interface ForecastPoint {
  x: string;
  historical: number | null;
  forecast: number | null;
  ci_lo: number | null;
  ci_hi: number | null;
}

export interface ForecastResponse {
  plan: ForecastPlanInput;
  series: ForecastPoint[];
  backtest: BacktestSummary;
  inventory: InventoryRecommendation;
  rows_used: number;
  unsupported?: string;
}

/** Generate forward labels matching the granularity of the historical series. */
function nextLabels(history: string[], horizon: number, granularity: "week" | "month"): string[] {
  if (history.length === 0) return [];
  const last = history[history.length - 1];
  if (granularity === "week") {
    // We don't have an exact ISO date for a "week label" — but we can step the cursor.
    // Reverse: pick the Monday of that ISO year-week. Simple approach: forecast labels are
    // synthetic "next-1, next-2, ..." style? That hurts the chart axis. We'll compute by
    // iterating one day at a time off the last week's Monday.
    // Easier: use weeksBetween from a date one period after the last historical bucket.
    // Approximate: take last week label "YYYY-Www", convert back: ISO week 1 starts on
    // the Monday on/before Jan 4. Step 7 days forward until we get a new label.
    const [yStr, wStr] = last.split("-W");
    const year = Number(yStr);
    const week = Number(wStr);
    // Approximate Monday of ISO week
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Day = (jan4.getUTCDay() + 6) % 7; // Mon=0
    const week1Monday = new Date(jan4);
    week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day);
    const monday = new Date(week1Monday);
    monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
    const start = monday.toISOString().slice(0, 10);
    const end = addDays(start, horizon * 7 + 6);
    const labels = weeksBetween(start, end);
    // weeksBetween(start) starts at last historical week — drop it.
    return labels.slice(1, 1 + horizon);
  }
  // month
  const [yStr, mStr] = last.split("-");
  let y = Number(yStr);
  let m = Number(mStr);
  m += 1;
  if (m > 12) {
    m = 1;
    y++;
  }
  const startMonth = `${y}-${String(m).padStart(2, "0")}-01`;
  // Compute end ~ horizon months later
  let endY = y;
  let endM = m + horizon - 1;
  while (endM > 12) {
    endM -= 12;
    endY++;
  }
  const endMonth = `${endY}-${String(endM).padStart(2, "0")}-28`;
  return monthsBetween(startMonth, endMonth);
}

export function runForecast(orders: Order[], plan: ForecastPlanInput): ForecastResponse {
  // Validate category if needed
  if (
    (plan.target === "category_orders" || plan.target === "category_revenue") &&
    !plan.category
  ) {
    return {
      plan,
      series: [],
      backtest: {
        results: [],
        best_method: "moving_average",
        holdout_size: 0,
        best_forecast: { method: "moving_average", fitted: [], forecast: [] },
      },
      inventory: {
        service_level: 0.95,
        z_score: 1.65,
        mean_demand: 0,
        std_demand: 0,
        lead_time_periods: 0,
        lead_time_days: 0,
        safety_stock: 0,
        reorder_point: 0,
        formula: "",
      },
      rows_used: 0,
      unsupported: `Forecast target ${plan.target} requires a category.`,
    };
  }

  const built = buildSeries(orders, plan);
  if (built.values.length < 4) {
    return {
      plan,
      series: [],
      backtest: {
        results: [],
        best_method: "moving_average",
        holdout_size: 0,
        best_forecast: { method: "moving_average", fitted: [], forecast: [] },
      },
      inventory: {
        service_level: 0.95,
        z_score: 1.65,
        mean_demand: 0,
        std_demand: 0,
        lead_time_periods: 0,
        lead_time_days: 0,
        safety_stock: 0,
        reorder_point: 0,
        formula: "",
      },
      rows_used: built.rows_used,
      unsupported: `Not enough history for ${plan.target}${plan.category ? ` (${plan.category})` : ""}: only ${built.values.length} ${plan.granularity} buckets.`,
    };
  }

  const summary = backtestAndChoose(built.values, plan.horizon);
  const futureLabels = nextLabels(built.labels, plan.horizon, plan.granularity);
  const sigma = summary.results.find((r) => r.method === summary.best_method)?.residual_std ?? 0;

  const series: ForecastPoint[] = [];
  for (let i = 0; i < built.labels.length; i++) {
    series.push({
      x: built.labels[i],
      historical: built.values[i],
      forecast: null,
      ci_lo: null,
      ci_hi: null,
    });
  }
  for (let i = 0; i < futureLabels.length; i++) {
    const f = summary.best_forecast.forecast[i];
    series.push({
      x: futureLabels[i],
      historical: null,
      forecast: Math.max(0, f), // demand can't be negative
      ci_lo: Math.max(0, f - 1.96 * sigma),
      ci_hi: f + 1.96 * sigma,
    });
  }

  const inventory = recommendInventory({
    history: built.values,
    forecast: summary.best_forecast.forecast,
    avgDeliveryDays: built.avg_delivery_days,
    granularity: plan.granularity,
  });

  return {
    plan,
    series,
    backtest: summary,
    inventory,
    rows_used: built.rows_used,
  };
}
