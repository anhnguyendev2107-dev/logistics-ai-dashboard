import { runAllMethods, type ForecastResult } from "./methods";

export interface BacktestResult {
  method: ForecastResult["method"];
  mape: number; // mean absolute percentage error on the holdout
  rmse: number; // root mean squared error on the holdout
  residual_std: number; // for confidence intervals
}

export interface BacktestSummary {
  results: BacktestResult[];
  best_method: ForecastResult["method"];
  holdout_size: number;
  /** The full series fits using the best method on ALL data + future predictions. */
  best_forecast: ForecastResult;
}

/**
 * Holdout 25% of the series (min 4 points), fit each method on the train portion,
 * forecast the holdout horizon, score MAPE/RMSE, then refit best method on full
 * data and produce the requested forward `horizon` forecasts.
 */
export function backtestAndChoose(values: number[], horizon: number): BacktestSummary {
  const n = values.length;
  if (n < 6) {
    // Not enough data for a holdout — just fit on all and use that.
    const all = runAllMethods(values, horizon);
    return {
      results: all.map((r) => ({
        method: r.method,
        mape: NaN,
        rmse: NaN,
        residual_std: 0,
      })),
      best_method: all[0].method,
      holdout_size: 0,
      best_forecast: all[0],
    };
  }
  const holdout = Math.max(4, Math.floor(n * 0.25));
  const train = values.slice(0, n - holdout);
  const test = values.slice(n - holdout);
  const candidates = runAllMethods(train, holdout);

  const results: BacktestResult[] = candidates.map((c) => {
    let absPctSum = 0;
    let absPctCount = 0;
    let sqSum = 0;
    for (let i = 0; i < holdout; i++) {
      const a = test[i];
      const p = c.forecast[i];
      const err = a - p;
      sqSum += err * err;
      if (a !== 0) {
        absPctSum += Math.abs(err / a);
        absPctCount++;
      }
    }
    const residuals = c.forecast.map((p, i) => test[i] - p);
    const meanRes = residuals.reduce((a, b) => a + b, 0) / residuals.length;
    const variance =
      residuals.reduce((a, r) => a + (r - meanRes) ** 2, 0) / Math.max(1, residuals.length - 1);
    return {
      method: c.method,
      mape: absPctCount === 0 ? Infinity : absPctSum / absPctCount,
      rmse: Math.sqrt(sqSum / holdout),
      residual_std: Math.sqrt(variance),
    };
  });

  const best = results.reduce((a, b) => (b.mape < a.mape ? b : a), results[0]);
  // Refit best method on full data for actual forward forecast
  const refits = runAllMethods(values, horizon);
  const best_forecast = refits.find((r) => r.method === best.method)!;
  return {
    results,
    best_method: best.method,
    holdout_size: holdout,
    best_forecast,
  };
}
