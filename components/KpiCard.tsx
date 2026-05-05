import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn" | "danger";
  icon?: LucideIcon;
  className?: string;
  delayMs?: number;
}

const toneClasses: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  good: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  warn: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  icon: Icon,
  className,
  delayMs = 0,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "fade-up group relative overflow-hidden rounded-xl border bg-white/70 p-5 backdrop-blur-sm transition-all",
        "border-zinc-200/70 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg",
        "dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:hover:border-zinc-700",
        className,
      )}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400">
          {label}
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg",
              toneClasses[tone],
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          </div>
        ) : null}
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>
      ) : null}
      {/* hover sheen */}
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-indigo-300/40" />
    </div>
  );
}
