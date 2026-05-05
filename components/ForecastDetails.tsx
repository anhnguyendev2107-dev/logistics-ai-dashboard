import { TrendingUp, Package2 } from "lucide-react";
import type { ForecastResponse } from "@/lib/forecasting/runForecast";
import { cn, formatNumber } from "@/lib/utils";

export function ForecastDetails({ forecast }: { forecast: ForecastResponse }) {
  const { backtest, inventory, plan } = forecast;
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Backtest */}
      <div className="overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-50/60 dark:border-zinc-800/70 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2 border-b border-zinc-200/70 bg-white/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-400">
          <TrendingUp className="h-3 w-3 text-indigo-500" />
          Backtest · holdout = {backtest.holdout_size}
        </div>
        <table className="w-full text-xs">
          <thead className="text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Method</th>
              <th className="px-3 py-1.5 text-right font-medium">MAPE</th>
              <th className="px-3 py-1.5 text-right font-medium">RMSE</th>
            </tr>
          </thead>
          <tbody>
            {backtest.results.map((r) => {
              const isBest = r.method === backtest.best_method;
              return (
                <tr
                  key={r.method}
                  className={cn(
                    "border-t border-zinc-200/50 dark:border-zinc-800/50",
                    isBest && "bg-emerald-50/50 dark:bg-emerald-950/20",
                  )}
                >
                  <td className="px-3 py-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        isBest
                          ? "font-semibold text-emerald-700 dark:text-emerald-400"
                          : "text-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      {isBest ? (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      )}
                      {r.method.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {Number.isFinite(r.mape) ? `${(r.mape * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {Number.isFinite(r.rmse) ? r.rmse.toFixed(2) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-zinc-200/70 bg-white/40 px-3 py-1.5 text-[10px] text-zinc-500 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-400">
          Lowest MAPE wins · refit on full series.
        </div>
      </div>

      {/* Inventory */}
      <div className="overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-50/60 dark:border-zinc-800/70 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2 border-b border-zinc-200/70 bg-white/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-400">
          <Package2 className="h-3 w-3 text-emerald-500" />
          Inventory recommendation
        </div>
        <div className="space-y-1.5 px-3 py-3 text-xs">
          <div className="flex items-baseline justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Reorder point</span>
            <span className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatNumber(inventory.reorder_point, { maximumFractionDigits: 1 })}
              <span className="ml-1 text-[10px] font-normal text-zinc-400">
                {plan.target === "category_revenue" ? "USD" : "units"} / {plan.granularity}
              </span>
            </span>
          </div>
          <Row label="Safety stock" value={formatNumber(inventory.safety_stock, { maximumFractionDigits: 1 })} />
          <Row label="Mean demand" value={formatNumber(inventory.mean_demand, { maximumFractionDigits: 2 })} />
          <Row label="Std demand" value={formatNumber(inventory.std_demand, { maximumFractionDigits: 2 })} />
          <Row
            label="Lead time"
            value={`${inventory.lead_time_days.toFixed(1)}d ≈ ${inventory.lead_time_periods.toFixed(2)} ${plan.granularity}s`}
          />
        </div>
        <div className="border-t border-zinc-200/70 bg-white/40 px-3 py-2 text-[10px] leading-relaxed text-zinc-500 dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:text-zinc-400">
          {inventory.formula}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200/30 pb-1 text-zinc-600 last:border-0 last:pb-0 dark:border-zinc-800/30 dark:text-zinc-400">
      <span>{label}</span>
      <span className="tabular-nums text-zinc-700 dark:text-zinc-300">{value}</span>
    </div>
  );
}
