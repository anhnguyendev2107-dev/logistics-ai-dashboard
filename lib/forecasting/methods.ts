/**
 * Three "basic forecasting methods" per the spec. All operate on a number[] of
 * equally-spaced observations (oldest → newest). All return horizon predictions.
 */

export interface ForecastResult {
  method: "moving_average" | "linear_regression" | "holt";
  fitted: number[]; // one per training point (NaN for warm-up positions)
  forecast: number[]; // length = horizon
}

/* ─────────────  Moving average  ───────────── */

export function movingAverage(values: number[], horizon: number, window = 4): ForecastResult {
  const fitted = values.map((_, i) => {
    if (i < window - 1) return NaN;
    let s = 0;
    for (let k = 0; k < window; k++) s += values[i - k];
    return s / window;
  });
  // The forecast for h steps ahead uses the last `window` actuals (no auto-recursion).
  const tail = values.slice(-window);
  const meanTail = tail.reduce((a, b) => a + b, 0) / tail.length;
  const forecast = Array(horizon).fill(meanTail);
  return { method: "moving_average", fitted, forecast };
}

/* ─────────────  Linear regression on time index  ───────────── */

export function linearRegression(values: number[], horizon: number): ForecastResult {
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const fitted = values.map((_, i) => intercept + slope * i);
  const forecast: number[] = [];
  for (let h = 1; h <= horizon; h++) forecast.push(intercept + slope * (n - 1 + h));
  return { method: "linear_regression", fitted, forecast };
}

/* ─────────────  Holt's linear (double exponential) smoothing  ───────────── */

export function holt(
  values: number[],
  horizon: number,
  alpha = 0.6,
  beta = 0.2,
): ForecastResult {
  if (values.length < 2) {
    return { method: "holt", fitted: values.slice(), forecast: Array(horizon).fill(values[0] ?? 0) };
  }
  let level = values[0];
  let trend = values[1] - values[0];
  const fitted: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    const prevLevel = level;
    const prevTrend = trend;
    level = alpha * values[i] + (1 - alpha) * (prevLevel + prevTrend);
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
    fitted.push(prevLevel + prevTrend);
  }
  const forecast: number[] = [];
  for (let h = 1; h <= horizon; h++) forecast.push(level + h * trend);
  return { method: "holt", fitted, forecast };
}

/* ─────────────  All-in-one  ───────────── */

export function runAllMethods(values: number[], horizon: number): ForecastResult[] {
  return [movingAverage(values, horizon), linearRegression(values, horizon), holt(values, horizon)];
}
