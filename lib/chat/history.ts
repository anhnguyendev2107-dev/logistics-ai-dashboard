import type { AskResponse } from "@/lib/ai/orchestrator";

export interface ChatTurn {
  id: string;
  question: string;
  /** null while the request is in-flight. */
  response: AskResponse | null;
}

export interface Conversation {
  id: string;
  /** Auto-derived from the first user question. */
  title: string;
  /** Unix ms. */
  created_at: number;
  updated_at: number;
  turns: ChatTurn[];
}

const KEY = "logistics-chat-conversations-v1";
/** Old single-list key used pre-history feature; auto-migrated on first read. */
const LEGACY_KEY = "logistics-chat-history-v1";

const MAX_CONVERSATIONS = 30;
const MAX_TURNS_PER_CONV = 50;

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Conversation[];
      if (Array.isArray(parsed)) return parsed;
    }
    // Migrate legacy single-list storage into one conversation
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const turns = JSON.parse(legacy) as ChatTurn[];
      if (Array.isArray(turns) && turns.length > 0) {
        const conv: Conversation = {
          id: crypto.randomUUID(),
          title: turnTitle(turns[0]),
          created_at: Date.now() - 1,
          updated_at: Date.now(),
          turns,
        };
        localStorage.setItem(KEY, JSON.stringify([conv]));
        localStorage.removeItem(LEGACY_KEY);
        return [conv];
      }
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch {
    // ignore corrupt storage
  }
  return [];
}

export function saveConversations(list: Conversation[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = list
      .slice()
      .sort((a, b) => b.updated_at - a.updated_at)
      .slice(0, MAX_CONVERSATIONS)
      .map((c) => ({ ...c, turns: c.turns.slice(-MAX_TURNS_PER_CONV) }));
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // quota exceeded — drop oldest and retry once
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 10)));
    } catch {
      // give up
    }
  }
}

export function createConversation(): Conversation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    created_at: now,
    updated_at: now,
    turns: [],
  };
}

export function turnTitle(turn: ChatTurn): string {
  const q = turn.question.trim();
  if (q.length <= 48) return q;
  return q.slice(0, 45).trimEnd() + "…";
}

/** Group conversations by relative date for the sidebar. */
export function groupByRecency(list: Conversation[]): { label: string; items: Conversation[] }[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const buckets: Record<string, Conversation[]> = {
    Today: [],
    Yesterday: [],
    "This week": [],
    Older: [],
  };

  for (const c of list) {
    const t = c.updated_at;
    if (t >= startOfToday) buckets.Today.push(c);
    else if (t >= startOfYesterday) buckets.Yesterday.push(c);
    else if (t >= startOfWeek) buckets["This week"].push(c);
    else buckets.Older.push(c);
  }

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({
      label,
      items: items.sort((a, b) => b.updated_at - a.updated_at),
    }));
}
