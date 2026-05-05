/**
 * Inventory recommendation derived directly from the dataset — no magic numbers.
 *
 * Formula:
 *   safety_stock = z * σ_demand * sqrt(L)
 *   reorder_point = μ_demand_during_lead * L  +  safety_stock
 *
 *   where μ, σ are computed over the historical demand series
 *   and L (lead time, in periods) is derived from average delivery days
 *   converted to whatever period the series uses.
 *
 * Service level: z=1.65 ≈ 95%.
 */

const Z_95 = 1.65;

export interface InventoryRecommendation {
  service_level: number;
  z_score: number;
  mean_demand: number;
  std_demand: number;
  lead_time_periods: number;
  lead_time_days: number;
  safety_stock: number;
  reorder_point: number;
  formula: string;
}

export function recommendInventory(args: {
  history: number[];
  forecast: number[];
  avgDeliveryDays: number;
  granularity: "week" | "month";
}): InventoryRecommendation {
  const { history, avgDeliveryDays, granularity } = args;
  const n = history.length;
  const mean = history.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const variance =
    history.reduce((a, x) => a + (x - mean) ** 2, 0) / Math.max(1, n - 1);
  const std = Math.sqrt(variance);

  const periodLengthDays = granularity === "week" ? 7 : 30;
  const leadPeriods = avgDeliveryDays / periodLengthDays;

  const safety_stock = Z_95 * std * Math.sqrt(leadPeriods);
  const reorder_point = mean * leadPeriods + safety_stock;

  return {
    service_level: 0.95,
    z_score: Z_95,
    mean_demand: mean,
    std_demand: std,
    lead_time_periods: leadPeriods,
    lead_time_days: avgDeliveryDays,
    safety_stock,
    reorder_point,
    formula:
      "ROP = μ·L + z·σ·√L  (z=1.65 for 95% service level; μ, σ from history; L = avg_delivery_days / period_length)",
  };
}
