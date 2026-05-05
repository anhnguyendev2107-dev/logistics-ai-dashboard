import { describe, expect, it } from "vitest";
import { holt, linearRegression, movingAverage } from "@/lib/forecasting/methods";
import { backtestAndChoose } from "@/lib/forecasting/backtest";
import { recommendInventory } from "@/lib/forecasting/inventory";

describe("movingAverage", () => {
  it("forecasts the mean of the last `window` values", () => {
    const r = movingAverage([1, 2, 3, 4, 5, 6], 3, 4);
    // Mean of last 4 = (3+4+5+6)/4 = 4.5
    expect(r.forecast).toEqual([4.5, 4.5, 4.5]);
    expect(r.fitted.slice(-1)[0]).toBeCloseTo(4.5, 6);
  });
});

describe("linearRegression", () => {
  it("recovers slope and intercept from a perfect line", () => {
    // y = 2x + 3, x = 0..9
    const values = Array.from({ length: 10 }, (_, i) => 2 * i + 3);
    const r = linearRegression(values, 3);
    // Expected forecasts at indices 10, 11, 12
    expect(r.forecast[0]).toBeCloseTo(23, 6);
    expect(r.forecast[1]).toBeCloseTo(25, 6);
    expect(r.forecast[2]).toBeCloseTo(27, 6);
  });
});

describe("holt", () => {
  it("extrapolates a trending series upward", () => {
    const values = [10, 12, 14, 16, 18, 20];
    const r = holt(values, 2);
    // Roughly continues +2 trend
    expect(r.forecast[0]).toBeGreaterThan(20);
    expect(r.forecast[1]).toBeGreaterThan(r.forecast[0]);
  });
});

describe("backtestAndChoose", () => {
  it("prefers linear regression on a clean linear series", () => {
    const values = Array.from({ length: 12 }, (_, i) => 5 + 2 * i);
    const summary = backtestAndChoose(values, 3);
    expect(summary.best_method).toBe("linear_regression");
    expect(summary.holdout_size).toBeGreaterThanOrEqual(3);
  });

  it("returns 3 candidates", () => {
    const values = Array.from({ length: 20 }, (_, i) => Math.sin(i / 3) * 5 + 10);
    const summary = backtestAndChoose(values, 4);
    expect(summary.results.map((r) => r.method).sort()).toEqual([
      "holt",
      "linear_regression",
      "moving_average",
    ]);
    expect(summary.best_forecast.forecast).toHaveLength(4);
  });
});

describe("recommendInventory", () => {
  it("safety stock scales with demand stddev and √lead-time", () => {
    const flat = recommendInventory({
      history: [10, 10, 10, 10, 10],
      forecast: [10, 10, 10, 10],
      avgDeliveryDays: 7,
      granularity: "week",
    });
    expect(flat.safety_stock).toBeCloseTo(0, 6); // zero variance → zero safety

    const noisy = recommendInventory({
      history: [5, 15, 5, 15, 5, 15],
      forecast: [10],
      avgDeliveryDays: 7,
      granularity: "week",
    });
    expect(noisy.safety_stock).toBeGreaterThan(0);
    // ROP is mean·L + safety, with L=1 (lead 7 days, weekly periods)
    expect(noisy.reorder_point).toBeGreaterThan(noisy.mean_demand);
  });
});
