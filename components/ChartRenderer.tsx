"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  ComposedChart,
} from "recharts";
import type { QueryResult } from "@/lib/analytics/queryExecutor";
import type { ForecastResponse } from "@/lib/forecasting/runForecast";
import { formatNumber, formatPercent } from "@/lib/utils";
import { regionLabel } from "@/lib/data/regions";

const COLOR = {
  primary: "#6366f1", // indigo-500
  primaryDim: "#a5b4fc",
  good: "#10b981", // emerald-500
  warn: "#f59e0b", // amber-500
  danger: "#ef4444", // red-500
};

const BAR_PALETTE = ["#6366f1", "#22c55e", "#06b6d4", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"];

function isPercent(metric: string) {
  return metric === "delay_rate" || metric === "on_time_rate";
}

function formatY(metric: string, v: number) {
  if (isPercent(metric)) return formatPercent(v);
  if (metric === "avg_delivery_days") return `${v.toFixed(2)}d`;
  return formatNumber(v);
}

function formatX(dimension: string | null | undefined, x: string): string {
  if (dimension === "region") return regionLabel(x);
  return x;
}

function ChartTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string }>;
  label?: string;
  metric: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-zinc-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/95">
      {label ? (
        <div className="mb-0.5 font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
      ) : null}
      {payload.map((p, i) => (
        <div key={`${p.name}-${i}`} className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
          {formatY(metric, Number(p.value))}
        </div>
      ))}
    </div>
  );
}

export function QueryChart({ result }: { result: QueryResult }) {
  const { plan, rows } = result;
  const isTime =
    plan.dimension === "date_day" ||
    plan.dimension === "date_week" ||
    plan.dimension === "date_month";

  if (plan.dimension === null && rows.length === 1) {
    return (
      <div className="text-5xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {formatY(plan.metric, rows[0].y)}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-zinc-400">
        No data matches this query.
      </div>
    );
  }

  if (isTime) {
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ComposedChart data={rows} margin={{ top: 10, right: 8, bottom: 24, left: -8 }}>
            <defs>
              <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR.primary} stopOpacity={0.25} />
                <stop offset="100%" stopColor={COLOR.primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
            <XAxis
              dataKey="x"
              tick={{ fontSize: 10, fill: "currentColor" }}
              className="text-zinc-500"
              angle={-30}
              dy={10}
              interval="preserveStartEnd"
              height={50}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "currentColor" }}
              className="text-zinc-500"
              tickFormatter={(v) => formatY(plan.metric, v)}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<ChartTooltip metric={plan.metric} />} cursor={{ stroke: COLOR.primary, strokeOpacity: 0.2 }} />
            <Area type="monotone" dataKey="y" stroke="none" fill="url(#lineFill)" />
            <Line
              type="monotone"
              dataKey="y"
              stroke={COLOR.primary}
              strokeWidth={2}
              dot={{ r: 2, fill: COLOR.primary, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: COLOR.primary, strokeWidth: 2, stroke: "white" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 10, right: 8, bottom: 24, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
          <XAxis
            dataKey="x"
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-zinc-500"
            interval={0}
            angle={plan.dimension === "region" ? 0 : -30}
            dy={10}
            height={50}
            axisLine={false}
            tickLine={false}
            tickFormatter={(x) => formatX(plan.dimension, String(x))}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "currentColor" }}
            className="text-zinc-500"
            tickFormatter={(v) => formatY(plan.metric, v)}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            content={<ChartTooltip metric={plan.metric} />}
            cursor={{ fill: "currentColor", className: "text-zinc-100 dark:text-zinc-800", fillOpacity: 0.5 }}
          />
          <Bar dataKey="y" radius={[6, 6, 0, 0]}>
            {rows.map((row, i) => (
              <Cell key={row.x} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ForecastChart({ forecast }: { forecast: ForecastResponse }) {
  const data = forecast.series.map((p) => ({
    x: p.x,
    historical: p.historical,
    forecast: p.forecast,
    band: p.ci_hi !== null && p.ci_lo !== null ? [p.ci_lo, p.ci_hi] : null,
  }));
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 24, left: -8 }}>
          <defs>
            <linearGradient id="historicalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR.primary} stopOpacity={0.2} />
              <stop offset="100%" stopColor={COLOR.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
          <XAxis
            dataKey="x"
            tick={{ fontSize: 10, fill: "currentColor" }}
            className="text-zinc-500"
            angle={-30}
            dy={10}
            interval="preserveStartEnd"
            height={50}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "currentColor" }}
            className="text-zinc-500"
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<ChartTooltip metric="count" />} cursor={{ stroke: COLOR.primary, strokeOpacity: 0.2 }} />
          <Area dataKey="historical" stroke="none" fill="url(#historicalFill)" connectNulls={false} />
          <Area
            dataKey="band"
            stroke="none"
            fill={COLOR.warn}
            fillOpacity={0.12}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="historical"
            stroke={COLOR.primary}
            strokeWidth={2}
            dot={{ r: 2, fill: COLOR.primary, strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke={COLOR.warn}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 3, fill: COLOR.warn, strokeWidth: 0 }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
