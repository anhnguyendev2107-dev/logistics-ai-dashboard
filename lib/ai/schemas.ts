import { z } from "zod";

/* ──────────────  Query plan  ────────────── */

export const MetricEnum = z.enum([
  "count",
  "sum_value",
  "delay_rate",
  "on_time_rate",
  "avg_delivery_days",
]);

export const DimensionEnum = z.enum([
  "carrier",
  "region",
  "warehouse",
  "product_category",
  "status",
  "destination_city",
  "origin_city",
  "date_day",
  "date_week",
  "date_month",
]);

export const ChartHintEnum = z.enum(["kpi", "line", "bar", "stacked_bar", "table"]);

export const QueryPlanSchema = z.object({
  metric: MetricEnum.describe("Aggregation function to apply."),
  dimension: DimensionEnum.nullable().describe(
    "Group-by dimension. null = aggregate the whole filtered set into a single value (KPI).",
  ),
  filters: z
    .object({
      date_from: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("Inclusive lower bound on order_date, ISO date."),
      date_to: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .describe("Inclusive upper bound on order_date, ISO date."),
      carrier: z.string().optional(),
      region: z.string().optional(),
      product_category: z.string().optional(),
      status: z.string().optional(),
      warehouse: z.string().optional(),
    })
    .describe("Equality filters applied before grouping."),
  sort: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().int().positive().max(100).default(20),
  chart_hint: ChartHintEnum.default("bar"),
});

export type QueryPlanInput = z.infer<typeof QueryPlanSchema>;

/* ──────────────  Forecast plan  ────────────── */

export const ForecastPlanSchema = z.object({
  target: z
    .enum(["total_orders", "category_orders", "category_revenue"])
    .describe("What to forecast."),
  category: z
    .string()
    .optional()
    .describe("Required when target is category_*. Must be one of the 8 product categories."),
  granularity: z.enum(["week", "month"]).default("week"),
  horizon: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(4)
    .describe("How many periods into the future to forecast."),
  methods: z
    .array(z.enum(["moving_average", "linear_regression", "holt"]))
    .default(["moving_average", "linear_regression", "holt"]),
});

export type ForecastPlanInput = z.infer<typeof ForecastPlanSchema>;

/* ──────────────  Clarification  ────────────── */

export const ClarifyOptionSchema = z.object({
  label: z.string(),
  /** A QueryPlan or ForecastPlan, JSON-serialized — chosen plan if user clicks this option. */
  plan: z.union([QueryPlanSchema, ForecastPlanSchema]),
  plan_kind: z.enum(["query", "forecast"]),
});

export const ClarifySchema = z.object({
  message: z.string().describe("One-line question to the user explaining the ambiguity."),
  options: z.array(ClarifyOptionSchema).min(2).max(4),
});

export type ClarifyInput = z.infer<typeof ClarifySchema>;

/* ──────────────  Decline (small talk / off-topic)  ────────────── */

export const DeclineSchema = z.object({
  message: z
    .string()
    .min(1)
    .max(400)
    .describe(
      "Friendly reply for greetings, thanks, or questions outside the dataset's scope. Should briefly steer the user toward what this assistant CAN do.",
    ),
});

export type DeclineInput = z.infer<typeof DeclineSchema>;

/* ──────────────  Router output  ────────────── */

export const RouterOutputSchema = z.object({
  tool: z.enum(["run_query", "run_forecast", "clarify", "decline"]),
  query: QueryPlanSchema.optional(),
  forecast: ForecastPlanSchema.optional(),
  clarify: ClarifySchema.optional(),
  decline: DeclineSchema.optional(),
  /** Short user-facing explanation of what the AI is doing — shown above the chart. */
  rationale: z.string().min(1).max(280),
});

export type RouterOutput = z.infer<typeof RouterOutputSchema>;
