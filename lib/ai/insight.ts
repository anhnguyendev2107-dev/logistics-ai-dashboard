/**
 * Second-pass LLM call: given the executed plan + concrete result, produce
 * 2–3 sentences of analyst-style commentary. The first pass (router) chooses
 * a tool; this pass interprets the data the executor returned. Keeping the two
 * passes separate means the LLM never invents numbers — it only describes what
 * it sees in the deterministic result.
 */

import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { QueryResult } from "../analytics/queryExecutor";
import type { ForecastResponse } from "../forecasting/runForecast";
import { KEY_ALIASES, readKeys } from "./keys";

const InsightSchema = z.object({
  insight: z
    .string()
    .min(20)
    .max(360)
    .describe(
      "2–3 sentences of analyst commentary. Cite specific numbers/categories visible in the data. No bullet points, no hedging.",
    ),
});

const SYSTEM = `
You are a senior logistics analyst writing one short paragraph of commentary on a chart's underlying data.

Rules:
- 2–3 sentences, max ~60 words total. No bullet points.
- Use specific numbers and category names from the data provided. Never invent numbers.
- Lead with the most interesting fact (peak, outlier, trend), then offer one why/so-what.
- Plain language. No jargon, no hedging like "appears to" or "could be".
- If data looks flat/boring, say so honestly.
`.trim();

interface Caller {
  name: string;
  call: (prompt: string) => Promise<{ object: { insight: string } }>;
}

function buildPool(): Caller[] {
  const pool: Caller[] = [];
  const baseArgs = {
    schema: InsightSchema,
    system: SYSTEM,
    temperature: 0.3,
  } as const;
  for (const [i, k] of readKeys(...KEY_ALIASES.google).entries()) {
    const provider = createGoogleGenerativeAI({ apiKey: k });
    pool.push({
      name: `google[${i}]`,
      call: (prompt) =>
        generateObject({ model: provider("gemini-2.5-flash"), prompt, ...baseArgs }),
    });
  }
  for (const [i, k] of readKeys(...KEY_ALIASES.anthropic).entries()) {
    const provider = createAnthropic({ apiKey: k });
    pool.push({
      name: `anthropic[${i}]`,
      call: (prompt) =>
        generateObject({ model: provider("claude-haiku-4-5"), prompt, ...baseArgs }),
    });
  }
  for (const [i, k] of readKeys(...KEY_ALIASES.openai).entries()) {
    const provider = createOpenAI({ apiKey: k });
    pool.push({
      name: `openai[${i}]`,
      call: (prompt) => generateObject({ model: provider("gpt-4o-mini"), prompt, ...baseArgs }),
    });
  }
  return pool;
}

async function callPool(prompt: string): Promise<string | null> {
  const pool = buildPool();
  for (const entry of pool) {
    try {
      const r = await entry.call(prompt);
      return r.object.insight;
    } catch {
      // try next provider
    }
  }
  return null;
}

/* ─────────────  Public  ───────────── */

export async function insightForQuery(
  question: string,
  result: QueryResult,
): Promise<string | null> {
  const { plan, rows } = result;
  // Compact preview (top 12) so the prompt stays short
  const preview = rows.slice(0, 12).map((r) => ({ x: r.x, y: r.y, n: r.count }));
  const prompt = [
    `Original user question: "${question}"`,
    "",
    `Plan: metric=${plan.metric}, dimension=${plan.dimension ?? "(none / KPI)"}, filters=${JSON.stringify(plan.filters)}.`,
    `Total rows used in computation: ${result.total_rows_used}.`,
    `Result rows (showing ${preview.length} of ${rows.length}):`,
    JSON.stringify(preview, null, 2),
    "",
    "Write the 2–3 sentence commentary.",
  ].join("\n");
  return callPool(prompt);
}

export async function insightForForecast(
  question: string,
  forecast: ForecastResponse,
): Promise<string | null> {
  if (forecast.unsupported) return null;
  const fc = forecast.backtest.best_forecast.forecast;
  const sumForecast = fc.reduce((a, b) => a + b, 0);
  const last = forecast.series.filter((p) => p.historical !== null).slice(-6);
  const pred = forecast.series.filter((p) => p.forecast !== null);
  const prompt = [
    `Original user question: "${question}"`,
    "",
    `Plan: target=${forecast.plan.target}, category=${forecast.plan.category ?? "—"}, granularity=${forecast.plan.granularity}, horizon=${forecast.plan.horizon}.`,
    `Best method: ${forecast.backtest.best_method} (selected by lowest MAPE on ${forecast.backtest.holdout_size}-period holdout).`,
    `MAPE comparison: ${forecast.backtest.results.map((r) => `${r.method}=${Number.isFinite(r.mape) ? (r.mape * 100).toFixed(1) + "%" : "n/a"}`).join(", ")}.`,
    `Recent history (last 6): ${JSON.stringify(last.map((p) => ({ x: p.x, y: p.historical })))}`,
    `Forecast: ${JSON.stringify(pred.map((p) => ({ x: p.x, y: p.forecast?.toFixed(2), lo: p.ci_lo?.toFixed(2), hi: p.ci_hi?.toFixed(2) })))}`,
    `Sum of forecast values: ${sumForecast.toFixed(1)} units.`,
    `Inventory recommendation: reorder_point=${forecast.inventory.reorder_point.toFixed(1)}, safety_stock=${forecast.inventory.safety_stock.toFixed(1)}.`,
    "",
    "Write the 2–3 sentence commentary about the trend, the chosen method, and inventory implication.",
  ].join("\n");
  return callPool(prompt);
}
