"use client";

import type { Order } from "@/lib/data/types";
import { Sparkles, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExplainBlock {
  /** Stable id of the turn this explain belongs to. */
  turn_id: string;
  provider: string;
  latency_ms: number;
  rationale: string;
  rows_used: number;
  plan: object;
  sample_rows: Order[];
  attempts?: { provider: string; error: string }[];
}

/* ─────────────  Trigger button (inside chat bubble)  ───────────── */

export function ExplainTrigger({
  block,
  active,
  onOpen,
}: {
  block: ExplainBlock;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className={cn(
        "mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-xs transition-colors",
        active
          ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"
          : "border-zinc-200/70 bg-zinc-50/60 text-zinc-600 hover:bg-zinc-100/80 dark:border-zinc-800/70 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-900/60",
      )}
    >
      <span className="flex items-center gap-2.5">
        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
        <span className="font-medium">Explain</span>
        <span className="text-zinc-400 dark:text-zinc-500">·</span>
        <span className="font-mono">{block.provider}</span>
        <span className="text-zinc-400 dark:text-zinc-500">·</span>
        <span className="tabular-nums">{block.latency_ms}ms</span>
        <span className="text-zinc-400 dark:text-zinc-500">·</span>
        <span className="tabular-nums">{block.rows_used} rows</span>
      </span>
      <span className="text-[10px] tracking-wider uppercase">{active ? "Open →" : "View →"}</span>
    </button>
  );
}

/* ─────────────  Right-side inspector panel  ───────────── */

export function ExplainPanel({ block, onClose }: { block: ExplainBlock; onClose: () => void }) {
  return (
    <>
      <button
        type="button"
        aria-label="Close explain panel"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-sm xl:hidden"
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-shrink-0 flex-col border-l border-zinc-200/60 bg-white/95 backdrop-blur-md xl:static xl:z-auto xl:w-96 xl:max-w-none xl:bg-white/70 dark:border-zinc-800/60 dark:bg-zinc-950/95 xl:dark:bg-zinc-950/70">
        <header className="flex items-center justify-between border-b border-zinc-200/60 px-4 py-3 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Explain</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close explain panel"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 text-xs">
          <Meta block={block} />
          <Section title="Rationale">
            <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{block.rationale}</p>
          </Section>
          <Section title="Query plan (deterministic executor input)">
            <pre className="overflow-x-auto rounded-lg border border-zinc-200/70 bg-zinc-50 p-3 font-mono text-[11px] leading-snug text-zinc-700 dark:border-zinc-800/70 dark:bg-zinc-900 dark:text-zinc-300">
              {JSON.stringify(block.plan, null, 2)}
            </pre>
          </Section>
          {block.sample_rows.length > 0 ? (
            <Section
              title={`Sample rows (showing ${block.sample_rows.length} of ${block.rows_used})`}
            >
              <div className="overflow-x-auto rounded-lg border border-zinc-200/70 dark:border-zinc-800/70">
                <table className="w-full text-[11px]">
                  <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50">
                    <tr>
                      {Object.keys(block.sample_rows[0]).map((k) => (
                        <th
                          key={k}
                          className="px-2.5 py-1.5 text-left font-medium tracking-wider whitespace-nowrap uppercase"
                        >
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.sample_rows.map((r) => (
                      <tr
                        key={r.order_id}
                        className="border-t border-zinc-100 hover:bg-zinc-50/50 dark:border-zinc-800/70 dark:hover:bg-zinc-900/30"
                      >
                        {Object.values(r).map((v, j) => (
                          <td
                            key={j}
                            className="px-2.5 py-1.5 font-mono whitespace-nowrap text-zinc-600 dark:text-zinc-400"
                          >
                            {String(v ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ) : null}
          {block.attempts && block.attempts.length > 0 ? (
            <Section title="Provider fallbacks">
              <ul className="space-y-1">
                {block.attempts.map((a, i) => (
                  <li
                    key={`${a.provider}-${i}`}
                    className="flex items-start gap-1.5 font-mono text-[11px] text-amber-700 dark:text-amber-400"
                  >
                    <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                    <span>
                      <span className="font-semibold">{a.provider}</span>: {a.error.slice(0, 200)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function Meta({ block }: { block: ExplainBlock }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-200/60 bg-zinc-50/60 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/40">
      <Stat label="Provider" value={block.provider} mono />
      <Stat label="Latency" value={`${block.latency_ms}ms`} mono />
      <Stat label="Rows" value={String(block.rows_used)} mono />
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-semibold tracking-[0.08em] text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-xs text-zinc-900 dark:text-zinc-100",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold tracking-[0.08em] text-zinc-500 uppercase dark:text-zinc-400">
        {title}
      </div>
      {children}
    </div>
  );
}
