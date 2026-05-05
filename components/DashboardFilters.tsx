"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { REGION_FLAG } from "@/lib/data/regions";

const REGIONS = ["", "US-E", "US-W", "US-C", "EU", "UK"];
const PRESETS: { label: string; from?: string; to?: string }[] = [
  { label: "All time" },
  { label: "Q1" , from: "2025-01-01", to: "2025-03-31" },
  { label: "Q2", from: "2025-04-01", to: "2025-06-30" },
  { label: "Q3", from: "2025-07-01", to: "2025-09-30" },
  { label: "Q4", from: "2025-10-01", to: "2025-12-31" },
];

export function DashboardFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const region = sp.get("region") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";

  const update = (next: { region?: string; from?: string; to?: string }) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    startTransition(() => {
      router.replace(`/?${p.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200/60 bg-white/60 p-1.5 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-900/50">
      <div className="flex items-center gap-0.5">
        {PRESETS.map((p) => {
          const active = (p.from ?? "") === from && (p.to ?? "") === to;
          return (
            <button
              key={p.label}
              onClick={() => update({ from: p.from ?? "", to: p.to ?? "" })}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-2 pr-1">
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
        ) : null}
        <span className="text-[11px] uppercase tracking-wider text-zinc-400">Region</span>
        <select
          value={region}
          onChange={(e) => update({ region: e.target.value })}
          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:ring-indigo-900/40"
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r === "" ? "🌍 All" : `${REGION_FLAG[r] ?? ""} ${r}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
