/**
 * Date bucketing utilities for time-series aggregation.
 * All buckets are returned as ISO-style strings so they sort lexicographically.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function toDay(isoDate: string): string {
  return isoDate.slice(0, 10);
}

/** ISO week label: e.g. "2025-W03". Mondays start the week, ISO 8601. */
export function toWeek(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  // ISO week algorithm: shift to Thursday, then count weeks from year-start Thursday.
  const dn = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() - dn + 3);
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((thursday.getTime() - firstThursday.getTime()) / MS_PER_DAY -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** "YYYY-MM" */
export function toMonth(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/** Add n days to an ISO date, returning ISO date. */
export function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Inclusive list of weekly bucket labels between two ISO dates. */
export function weeksBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let cursor = from;
  let last = "";
  while (cursor <= to) {
    const w = toWeek(cursor);
    if (w !== last) out.push(w);
    last = w;
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** Inclusive list of monthly buckets. */
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const [yA, mA] = from.slice(0, 7).split("-").map(Number);
  const [yB, mB] = to.slice(0, 7).split("-").map(Number);
  let y = yA;
  let m = mA;
  while (y < yB || (y === yB && m <= mB)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}
