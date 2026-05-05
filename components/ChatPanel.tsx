"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Sparkles, BarChart3, TrendingUp, Clock } from "lucide-react";
import { ForecastChart, QueryChart } from "./ChartRenderer";
import { ExplainDrawer } from "./ExplainDrawer";
import { ForecastDetails } from "./ForecastDetails";
import { HistorySidebar } from "./HistorySidebar";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import type { AskResponse } from "@/lib/ai/orchestrator";
import {
  createConversation,
  loadConversations,
  saveConversations,
  turnTitle,
  type ChatTurn,
  type Conversation,
} from "@/lib/chat/history";

const SUGGESTIONS: { label: string; icon: typeof BarChart3 }[] = [
  { label: "Which carrier has the highest delay rate?", icon: BarChart3 },
  { label: "Show weekly delivered orders for Q4 2025", icon: Clock },
  { label: "Predict total orders for the next 4 weeks", icon: TrendingUp },
  { label: "Predict crayon demand for the next 3 months", icon: TrendingUp },
];

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const turns = active?.turns ?? [];

  // Initial load from localStorage
  useEffect(() => {
    const list = loadConversations();
    setConversations(list);
    setActiveId(list[0]?.id ?? null);
  }, []);

  // Persist on every change (debouncing isn't worth it for 30 entries)
  useEffect(() => {
    if (conversations.length === 0) return;
    saveConversations(conversations);
  }, [conversations]);

  // Auto-scroll to bottom when turns change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  function newChat() {
    const c = createConversation();
    setConversations((list) => [c, ...list]);
    setActiveId(c.id);
    setInput("");
  }

  function deleteConv(id: string) {
    setConversations((list) => {
      const next = list.filter((c) => c.id !== id);
      if (id === activeId) setActiveId(next[0]?.id ?? null);
      return next;
    });
  }

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");

    // Make sure we have an active conversation.
    let convId = activeId;
    if (!convId) {
      const fresh = createConversation();
      convId = fresh.id;
      setConversations((list) => [fresh, ...list]);
      setActiveId(fresh.id);
    }

    const turnId = crypto.randomUUID();
    const newTurn: ChatTurn = { id: turnId, question: q, response: null };

    setConversations((list) =>
      list.map((c) => {
        if (c.id !== convId) return c;
        const isFirst = c.turns.length === 0;
        return {
          ...c,
          title: isFirst ? turnTitle(newTurn) : c.title,
          updated_at: Date.now(),
          turns: [...c.turns, newTurn],
        };
      }),
    );

    const settle = (response: AskResponse) => {
      setConversations((list) =>
        list.map((c) => {
          if (c.id !== convId) return c;
          return {
            ...c,
            updated_at: Date.now(),
            turns: c.turns.map((t) => (t.id === turnId ? { ...t, response } : t)),
          };
        }),
      );
    };

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const json = (await res.json()) as AskResponse;
      settle(json);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      settle({
        kind: "error",
        question: q,
        rationale: "",
        provider: "",
        latency_ms: 0,
        attempts: [],
        error,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <HistorySidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={newChat}
        onDelete={deleteConv}
      />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 sm:px-6">
        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto py-8">
            {turns.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-6">
                {turns.map((t) => (
                  <Turn key={t.id} turn={t} onPick={send} />
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-zinc-200/60 bg-zinc-50/80 px-4 pb-4 pt-3 backdrop-blur-xl sm:-mx-6 sm:px-6 dark:border-zinc-800/60 dark:bg-zinc-950/80"
          >
            <SuggestionStrip onPick={send} disabled={busy} />
            <div className="mt-3 flex items-end gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 shadow-sm transition-all focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-indigo-600 dark:focus-within:ring-indigo-900/30">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about delays, volume, forecasts…"
                  disabled={busy}
                  className="flex-1 bg-transparent text-sm placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition-all",
                  busy || !input.trim()
                    ? "bg-zinc-200 text-zinc-400 dark:bg-zinc-800"
                    : "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:brightness-110",
                )}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="fade-up mx-auto max-w-2xl py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Ask the data
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        Natural-language analytics over your logistics dataset. The AI translates each question
        into a typed query plan, runs it deterministically, and shows you the math.
      </p>
      <p className="mt-6 text-xs uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
        ↓ pick a starter question below
      </p>
    </div>
  );
}

function SuggestionStrip({
  onPick,
  disabled,
}: {
  onPick: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {SUGGESTIONS.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          onClick={() => onPick(label)}
          disabled={disabled}
          className="group inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-700 backdrop-blur-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
        >
          <Icon className="h-3 w-3 text-zinc-400 transition-colors group-hover:text-indigo-500 dark:text-zinc-500 dark:group-hover:text-indigo-400" />
          <span className="whitespace-nowrap">{label}</span>
        </button>
      ))}
    </div>
  );
}

function Turn({ turn, onPick }: { turn: ChatTurn; onPick: (q: string) => void }) {
  const r = turn.response;
  return (
    <div className="space-y-3">
      <div className="fade-up flex justify-end">
        <span className="max-w-md rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-500 to-violet-500 px-4 py-2 text-sm text-white shadow-md shadow-indigo-500/20">
          {turn.question}
        </span>
      </div>
      {r === null ? (
        <ThinkingBubble />
      ) : (
        <div className="fade-up rounded-2xl rounded-tl-md border border-zinc-200/70 bg-white/80 p-5 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-950/70">
          <ResponseBody response={r} onPick={onPick} />
        </div>
      )}
    </div>
  );
}

function ResponseBody({ response, onPick }: { response: AskResponse; onPick: (q: string) => void }) {
  if (response.kind === "error") {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        <strong>Error:</strong> {response.error}
      </div>
    );
  }
  if (response.kind === "decline" && response.decline) {
    return <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{response.decline.message}</p>;
  }
  if (response.kind === "clarify" && response.clarify) {
    return (
      <>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{response.clarify.message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {response.clarify.options.map((opt, i) => (
            <button
              key={`${opt.label}-${i}`}
              onClick={() => onPick(opt.label)}
              className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs font-medium hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-indigo-500 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
            >
              {opt.label}
            </button>
          ))}
        </div>
        <ExplainDrawer
          block={{
            provider: response.provider,
            latency_ms: response.latency_ms,
            rationale: response.rationale,
            rows_used: 0,
            plan: response.clarify,
            sample_rows: [],
            attempts: response.attempts,
          }}
        />
      </>
    );
  }
  if (response.kind === "query" && response.query) {
    return (
      <>
        <div className="mb-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {summarizeQuery(response)}
        </div>
        <QueryChart result={response.query} />
        {response.insight ? <InsightCallout text={response.insight} /> : null}
        <ExplainDrawer
          block={{
            provider: response.provider,
            latency_ms: response.latency_ms,
            rationale: response.rationale,
            rows_used: response.query.total_rows_used,
            plan: response.query.plan,
            sample_rows: response.query.filtered_sample,
            attempts: response.attempts,
          }}
        />
      </>
    );
  }
  if (response.kind === "forecast" && response.forecast) {
    return (
      <>
        <div className="mb-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {summarizeForecast(response)}
        </div>
        {response.forecast.unsupported ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            {response.forecast.unsupported}
          </p>
        ) : (
          <>
            <ForecastChart forecast={response.forecast} />
            <ForecastDetails forecast={response.forecast} />
          </>
        )}
        {response.insight ? <InsightCallout text={response.insight} /> : null}
        <ExplainDrawer
          block={{
            provider: response.provider,
            latency_ms: response.latency_ms,
            rationale: response.rationale,
            rows_used: response.forecast.rows_used,
            plan: response.forecast.plan,
            sample_rows: [],
            attempts: response.attempts,
          }}
        />
      </>
    );
  }
  return null;
}

function summarizeQuery(r: AskResponse): string {
  if (!r.query) return r.rationale;
  const { plan, rows } = r.query;
  if (plan.dimension === null && rows.length === 1) {
    const v = rows[0].y;
    if (plan.metric === "delay_rate" || plan.metric === "on_time_rate") {
      return `${formatPercent(v)} (over ${rows[0].count} terminal-status orders).`;
    }
    if (plan.metric === "avg_delivery_days") {
      return `Average delivery time: ${v.toFixed(2)} days (n=${rows[0].count}).`;
    }
    return `${formatNumber(v)} (n=${rows[0].count}).`;
  }
  return r.rationale;
}

function summarizeForecast(r: AskResponse): string {
  if (!r.forecast || r.forecast.unsupported) return r.rationale;
  const total = r.forecast.backtest.best_forecast.forecast.reduce((a, b) => a + b, 0);
  const method = r.forecast.backtest.best_method.replaceAll("_", " ");
  return `${method} predicts ~${formatNumber(total, { maximumFractionDigits: 0 })} units across the next ${r.forecast.plan.horizon} ${r.forecast.plan.granularity}s.`;
}

function InsightCallout({ text }: { text: string }) {
  return (
    <div className="fade-up mt-4 flex gap-3 rounded-xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-violet-50/60 p-3.5 dark:border-indigo-800/40 dark:from-indigo-950/30 dark:to-violet-950/20">
      <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
      <div>
        <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-indigo-600 dark:text-indigo-400">
          Insight
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{text}</p>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="fade-up flex items-center gap-2 rounded-2xl rounded-tl-md border border-zinc-200/70 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-950/70">
      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
      <div className="flex items-center gap-1">
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ animationDelay: "0ms" }} />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ animationDelay: "150ms" }} />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-xs text-zinc-500">Routing your question…</span>
    </div>
  );
}
