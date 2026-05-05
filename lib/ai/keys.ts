/** Comma-separated env var → list of trimmed non-empty keys. */
export function splitKeys(env: string | undefined): string[] {
  if (!env) return [];
  return env
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Read keys from any of several common env var names, dedup, preserve order. */
export function readKeys(...envNames: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of envNames) {
    for (const k of splitKeys(process.env[name])) {
      if (!seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    }
  }
  return out;
}

/** Standard env var name aliases per provider (Vercel AI SDK + community conventions). */
export const KEY_ALIASES = {
  google: ["GOOGLE_API_KEYS", "GEMINI_API_KEYS", "GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
  anthropic: ["ANTHROPIC_API_KEYS", "ANTHROPIC_API_KEY"],
  openai: ["OPENAI_API_KEYS", "OPENAI_API_KEY"],
} as const;
