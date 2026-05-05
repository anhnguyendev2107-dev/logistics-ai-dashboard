"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DeliveryPerfPoint } from "@/lib/analytics/dashboard";

const DELIVERED_COLOR = "#10b981"; // emerald-500
const DELAYED_COLOR = "#f59e0b"; // amber-500

function StackedTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((acc, p) => acc + Number(p.value ?? 0), 0);
  return (
    <div className="rounded-lg border border-zinc-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/95">
      {label ? (
        <div className="mb-1 font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
      ) : null}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 tabular-nums">
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-zinc-600 dark:text-zinc-400">{p.name}</span>
          <span className="ml-auto font-semibold text-zinc-900 dark:text-zinc-100">{p.value}</span>
        </div>
      ))}
      {total > 0 ? (
        <div className="mt-1 border-t border-zinc-100 pt-1 text-[10px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {payload[1]?.value !== undefined && total > 0
            ? `${((Number(payload[1].value) / total) * 100).toFixed(1)}% delayed`
            : null}
        </div>
      ) : null}
    </div>
  );
}

export function StackedDeliveryChart({ data }: { data: DeliveryPerfPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-zinc-400">
        No terminal-status orders in this view.
      </div>
    );
  }
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 8, bottom: 24, left: -8 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            className="text-zinc-200 dark:text-zinc-800"
            vertical={false}
          />
          <XAxis
            dataKey="x"
            tick={{ fontSize: 10, fill: "currentColor" }}
            className="text-zinc-500"
            axisLine={false}
            tickLine={false}
            angle={-30}
            dy={10}
            height={50}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "currentColor" }}
            className="text-zinc-500"
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<StackedTooltip />} cursor={{ fill: "currentColor", className: "text-zinc-100 dark:text-zinc-800", fillOpacity: 0.4 }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          />
          <Bar
            dataKey="delivered"
            name="Delivered"
            stackId="status"
            fill={DELIVERED_COLOR}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="delayed"
            name="Delayed"
            stackId="status"
            fill={DELAYED_COLOR}
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
