import { NextResponse } from "next/server";
import { providerStatus } from "@/lib/ai/router";
import { cacheStats } from "@/lib/cache/lru";
import { loadOrders } from "@/lib/data/loader";

export const runtime = "nodejs";

export async function GET() {
  const orders = loadOrders();
  return NextResponse.json({
    ok: true,
    dataset: {
      rows: orders.length,
      date_range: {
        from: orders.reduce((a, b) => (a.order_date < b.order_date ? a : b)).order_date,
        to: orders.reduce((a, b) => (a.order_date > b.order_date ? a : b)).order_date,
      },
    },
    providers: providerStatus(),
    cache: cacheStats(),
  });
}
