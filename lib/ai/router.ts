import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { RouterOutputSchema, type RouterOutput } from "./schemas";
import { SYSTEM_PROMPT } from "./prompts";
import { KEY_ALIASES, readKeys } from "./keys";

/* ─────────────  Provider pool  ─────────────
 * Comma-separated env vars, tried left-to-right.
 * On any error from one key, the next is tried.
 */

interface ProviderEntry {
  name: string; // e.g. "google[0]"
  call: () => Promise<{ object: RouterOutput }>;
}

const GOOGLE_MODEL = "gemini-2.5-flash";
const ANTHROPIC_MODEL = "claude-haiku-4-5";
const OPENAI_MODEL = "gpt-4o-mini";

function buildPool(question: string): ProviderEntry[] {
  const pool: ProviderEntry[] = [];
  const baseArgs = {
    schema: RouterOutputSchema,
    system: SYSTEM_PROMPT,
    prompt: `User question: ${question}`,
    temperature: 0,
  } as const;

  for (const [i, k] of readKeys(...KEY_ALIASES.google).entries()) {
    const provider = createGoogleGenerativeAI({ apiKey: k });
    pool.push({
      name: `google[${i}]`,
      call: () => generateObject({ model: provider(GOOGLE_MODEL), ...baseArgs }),
    });
  }
  for (const [i, k] of readKeys(...KEY_ALIASES.anthropic).entries()) {
    const provider = createAnthropic({ apiKey: k });
    pool.push({
      name: `anthropic[${i}]`,
      call: () => generateObject({ model: provider(ANTHROPIC_MODEL), ...baseArgs }),
    });
  }
  for (const [i, k] of readKeys(...KEY_ALIASES.openai).entries()) {
    const provider = createOpenAI({ apiKey: k });
    pool.push({
      name: `openai[${i}]`,
      call: () => generateObject({ model: provider(OPENAI_MODEL), ...baseArgs }),
    });
  }
  return pool;
}

export interface RouteResult {
  output: RouterOutput;
  provider: string;
  attempts: { provider: string; error: string }[];
  latency_ms: number;
}

export async function routeQuestion(question: string): Promise<RouteResult> {
  const pool = buildPool(question);
  if (pool.length === 0) {
    throw new Error(
      "No AI provider keys configured. Set one of: GEMINI_API_KEY / GOOGLE_API_KEYS, ANTHROPIC_API_KEY(S), or OPENAI_API_KEY(S) in .env.local — then restart `npm run dev`.",
    );
  }
  const attempts: { provider: string; error: string }[] = [];
  const t0 = Date.now();
  for (const entry of pool) {
    try {
      const r = await entry.call();
      return {
        output: r.object,
        provider: entry.name,
        attempts,
        latency_ms: Date.now() - t0,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      attempts.push({ provider: entry.name, error: msg });
    }
  }
  throw new Error(
    `All ${pool.length} provider keys failed. Last errors: ${JSON.stringify(attempts.slice(-3))}`,
  );
}

export function providerStatus(): { configured: boolean; counts: Record<string, number> } {
  const counts = {
    google: readKeys(...KEY_ALIASES.google).length,
    anthropic: readKeys(...KEY_ALIASES.anthropic).length,
    openai: readKeys(...KEY_ALIASES.openai).length,
  };
  return {
    configured: counts.google + counts.anthropic + counts.openai > 0,
    counts,
  };
}
