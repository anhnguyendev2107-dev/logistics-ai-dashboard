export type OrderStatus = "delivered" | "delayed" | "in_transit" | "exception" | "canceled";

export type Region = "US-E" | "US-W" | "US-C" | "EU" | "UK";

export interface Order {
  client_id: string;
  order_id: string;
  order_date: string; // YYYY-MM-DD
  delivery_date: string | null; // YYYY-MM-DD or null when not yet delivered
  carrier: string;
  origin_city: string;
  destination_city: string;
  status: OrderStatus;
  sku: string;
  product_category: string;
  quantity: number;
  unit_price_usd: number;
  order_value_usd: number;
  is_promo: boolean;
  promo_discount_pct: number;
  region: Region;
  warehouse: string;
  // derived
  delivery_days: number | null; // computed at load time when delivery_date is present
}

/**
 * The reference "today" used for relative date phrases like "last month".
 * Pinned because the dataset is a fixed snapshot (2025-01-01 to 2025-12-30).
 */
export const REFERENCE_TODAY = "2025-12-30";
