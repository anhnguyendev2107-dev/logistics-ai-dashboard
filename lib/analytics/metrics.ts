import type { Order } from "../data/types";

export interface KpiSummary {
  total_orders: number;
  delivered: number;
  delayed: number;
  in_transit: number;
  exception: number;
  canceled: number;
  /** Of orders with terminal status (delivered ∪ delayed). */
  delay_rate: number;
  on_time_rate: number;
  /** Mean (delivery_date − order_date) in days, over rows where both exist. */
  avg_delivery_days: number;
  avg_delivery_days_n: number;
}

export function computeKpis(orders: Order[]): KpiSummary {
  let delivered = 0;
  let delayed = 0;
  let in_transit = 0;
  let exception = 0;
  let canceled = 0;

  let dd_sum = 0;
  let dd_n = 0;

  for (const o of orders) {
    switch (o.status) {
      case "delivered":
        delivered++;
        break;
      case "delayed":
        delayed++;
        break;
      case "in_transit":
        in_transit++;
        break;
      case "exception":
        exception++;
        break;
      case "canceled":
        canceled++;
        break;
    }
    if (o.delivery_days !== null) {
      dd_sum += o.delivery_days;
      dd_n++;
    }
  }

  const terminal = delivered + delayed;
  return {
    total_orders: orders.length,
    delivered,
    delayed,
    in_transit,
    exception,
    canceled,
    delay_rate: terminal === 0 ? 0 : delayed / terminal,
    on_time_rate: terminal === 0 ? 0 : delivered / terminal,
    avg_delivery_days: dd_n === 0 ? 0 : dd_sum / dd_n,
    avg_delivery_days_n: dd_n,
  };
}
