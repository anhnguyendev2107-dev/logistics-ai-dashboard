import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import type { Order, OrderStatus, Region } from "./types";

let cachedOrders: Order[] | null = null;

const CSV_PATH = path.join(process.cwd(), "data", "mock_logistics_data.csv");

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function parseRow(row: Record<string, string>): Order {
  const order_date = row.order_date;
  const delivery_date = row.delivery_date && row.delivery_date.length > 0 ? row.delivery_date : null;
  return {
    client_id: row.client_id,
    order_id: row.order_id,
    order_date,
    delivery_date,
    carrier: row.carrier,
    origin_city: row.origin_city,
    destination_city: row.destination_city,
    status: row.status as OrderStatus,
    sku: row.sku,
    product_category: row.product_category,
    quantity: Number(row.quantity),
    unit_price_usd: Number(row.unit_price_usd),
    order_value_usd: Number(row.order_value_usd),
    is_promo: row.is_promo === "1",
    promo_discount_pct: Number(row.promo_discount_pct),
    region: row.region as Region,
    warehouse: row.warehouse,
    delivery_days: delivery_date ? daysBetween(order_date, delivery_date) : null,
  };
}

export function loadOrders(): Order[] {
  if (cachedOrders) return cachedOrders;
  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parse errors: ${JSON.stringify(parsed.errors.slice(0, 3))}`);
  }
  cachedOrders = parsed.data.map(parseRow);
  return cachedOrders;
}

/** For testing: inject a fixture instead of reading the CSV. */
export function setOrdersForTest(orders: Order[]): void {
  cachedOrders = orders;
}
