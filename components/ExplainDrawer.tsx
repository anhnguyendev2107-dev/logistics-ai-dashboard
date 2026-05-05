"use client";

import { useState } from "react";
import type { Order } from "@/lib/data/types";
import { ChevronDown, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExplainBlock {
  provider: string;
  latency_ms: number;
  rationale: string;
  rows_used: number;
  plan: object;
  sample_rows: Order[];
  attempts?: { provider: string; error: string }[];
}

export function ExplainDrawer({ block }: { block: ExplainBlock }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-50/60 dark:border-zinc-800/70 dark:bg-zinc-900/40">
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:bg-zinc-900/60"
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
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="space-y-4 border-t border-zinc-200/70 bg-white/70 px-4 py-4 text-xs backdrop-blur-sm dark:border-zinc-800/70 dark:bg-zinc-950/70">
          <Section title="Rationale">
            <p className="text-zinc-700 dark:text-zinc-300">{block.rationale}</p>
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
                        <th key={k} className="px-2.5 py-1.5 text-left font-medium uppercase tracking-wider">
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
                            className="whitespace-nowrap px-2.5 py-1.5 font-mono text-zinc-600 dark:text-zinc-400"
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
                      <span className="font-semibold">{a.provider}</span>: {a.error.slice(0, 120)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
        {title}
      </div>
      {children}
    </div>
  );
}
