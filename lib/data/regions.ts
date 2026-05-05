/** Display label + flag emoji for a region code. */
export const REGION_FLAG: Record<string, string> = {
  "US-E": "🇺🇸",
  "US-W": "🇺🇸",
  "US-C": "🇺🇸",
  EU: "🇪🇺",
  UK: "🇬🇧",
};

export function regionLabel(code: string): string {
  const flag = REGION_FLAG[code];
  return flag ? `${flag} ${code}` : code;
}
