import { loadOrders } from "../data/loader";
import { runQuery, type QueryResult } from "../analytics/queryExecutor";
import { runForecast, type ForecastResponse } from "../forecasting/runForecast";
import { routeQuestion } from "./router";
import { cacheGet, cacheSet, normalizeQuestion } from "../cache/lru";
import { insightForForecast, insightForQuery } from "./insight";
import type { ClarifyInput, DeclineInput, RouterOutput } from "./schemas";

export type AskKind = "query" | "forecast" | "clarify" | "decline" | "error";

export interface AskResponse {
  kind: AskKind;
  question: string;
  rationale: string;
  /** Provider that answered (e.g. "google[0]") or "cache". */
  provider: string;
  latency_ms: number;
  /** Provider attempts that failed before success. */
  attempts: { provider: string; error: string }[];
  query?: QueryResult;
  forecast?: ForecastResponse;
  clarify?: ClarifyInput;
  decline?: DeclineInput;
  error?: string;
  /** 2–3 sentences of analyst commentary, generated AFTER the executor ran. */
  insight?: string;
}

export async function ask(question: string): Promise<AskResponse> {
  const t0 = Date.now();
  const trimmed = question.trim();
  if (!trimmed) {
    return {
      kind: "error",
      question,
      rationale: "",
      provider: "",
      latency_ms: 0,
      attempts: [],
      error: "Empty question.",
    };
  }

  const cacheKey = `ask:${normalizeQuestion(trimmed)}`;
  const hit = cacheGet<AskResponse>(cacheKey);
  if (hit) {
    return { ...hit, provider: "cache", latency_ms: Date.now() - t0 };
  }

  let routed: { output: RouterOutput; provider: string; attempts: { provider: string; error: string }[]; latency_ms: number };
  try {
    routed = await routeQuestion(trimmed);
  } catch (err) {
    return {
      kind: "error",
      question: trimmed,
      rationale: "",
      provider: "",
      latency_ms: Date.now() - t0,
      attempts: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const orders = loadOrders();
  const out = routed.output;

  let response: AskResponse;
  if (out.tool === "run_query" && out.query) {
    const result = runQuery(orders, {
      ...out.query,
      filters: out.query.filters ?? {},
    });
    const insight = await insightForQuery(trimmed, result).catch(() => null);
    response = {
      kind: "query",
      question: trimmed,
      rationale: out.rationale,
      provider: routed.provider,
      latency_ms: Date.now() - t0,
      attempts: routed.attempts,
      query: result,
      insight: insight ?? undefined,
    };
  } else if (out.tool === "run_forecast" && out.forecast) {
    const result = runForecast(orders, out.forecast);
    const insight = result.unsupported
      ? null
      : await insightForForecast(trimmed, result).catch(() => null);
    response = {
      kind: "forecast",
      question: trimmed,
      rationale: out.rationale,
      provider: routed.provider,
      latency_ms: Date.now() - t0,
      attempts: routed.attempts,
      forecast: result,
      insight: insight ?? undefined,
    };
  } else if (out.tool === "clarify" && out.clarify) {
    response = {
      kind: "clarify",
      question: trimmed,
      rationale: out.rationale,
      provider: routed.provider,
      latency_ms: Date.now() - t0,
      attempts: routed.attempts,
      clarify: out.clarify,
    };
  } else if (out.tool === "decline" && out.decline) {
    response = {
      kind: "decline",
      question: trimmed,
      rationale: out.rationale,
      provider: routed.provider,
      latency_ms: Date.now() - t0,
      attempts: routed.attempts,
      decline: out.decline,
    };
  } else {
    response = {
      kind: "error",
      question: trimmed,
      rationale: out.rationale,
      provider: routed.provider,
      latency_ms: Date.now() - t0,
      attempts: routed.attempts,
      error: `Router chose tool=${out.tool} but did not provide a matching plan.`,
    };
  }

  if (response.kind !== "error") cacheSet(cacheKey, response);
  return response;
}
