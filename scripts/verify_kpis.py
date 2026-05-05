#!/usr/bin/env python3
"""
Ground-truth KPI calculator. Reads the CSV with pandas and prints expected
values for the dashboard's headline KPIs. The TypeScript implementation
must match these numbers exactly — used as the source of truth for tests.

Run: python3 scripts/verify_kpis.py
"""
from __future__ import annotations

import csv
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

CSV = Path(__file__).resolve().parent.parent / "data" / "mock_logistics_data.csv"


def parse_date(s: str) -> date | None:
    return date.fromisoformat(s) if s else None


def main() -> None:
    rows = list(csv.DictReader(CSV.open()))
    n = len(rows)

    status_counts = Counter(r["status"] for r in rows)
    delivered = status_counts["delivered"]
    delayed = status_counts["delayed"]
    in_transit = status_counts["in_transit"]
    exception = status_counts["exception"]
    canceled = status_counts["canceled"]

    # delay_rate denominator = orders with terminal delivery state {delivered, delayed}
    terminal = delivered + delayed
    delay_rate = delayed / terminal if terminal else 0
    on_time_rate = delivered / terminal if terminal else 0

    # avg delivery days only for rows with non-null delivery_date
    deltas = []
    for r in rows:
        od = parse_date(r["order_date"])
        dd = parse_date(r["delivery_date"])
        if od and dd:
            deltas.append((dd - od).days)
    avg_days = sum(deltas) / len(deltas) if deltas else 0

    print("=" * 60)
    print("GROUND-TRUTH KPIs (TS implementation must match)")
    print("=" * 60)
    print(f"total_orders         : {n}")
    print(f"delivered            : {delivered}")
    print(f"delayed              : {delayed}")
    print(f"in_transit           : {in_transit}")
    print(f"exception            : {exception}")
    print(f"canceled             : {canceled}")
    print(f"delay_rate (of terminal {terminal}): {delay_rate:.6f}")
    print(f"on_time_rate         : {on_time_rate:.6f}")
    print(f"avg_delivery_days (n={len(deltas)}): {avg_days:.6f}")

    # delay rate by carrier (top 5)
    print("\nDelay rate by carrier (terminal orders only):")
    by_carrier_total: defaultdict[str, int] = defaultdict(int)
    by_carrier_delayed: defaultdict[str, int] = defaultdict(int)
    for r in rows:
        if r["status"] in ("delivered", "delayed"):
            by_carrier_total[r["carrier"]] += 1
            if r["status"] == "delayed":
                by_carrier_delayed[r["carrier"]] += 1
    rates = sorted(
        ((c, by_carrier_delayed[c] / by_carrier_total[c], by_carrier_total[c]) for c in by_carrier_total),
        key=lambda x: x[1],
        reverse=True,
    )
    for c, rate, total in rates:
        print(f"  {c:12s}: {rate:.4f} ({by_carrier_delayed[c]}/{total})")

    # weekly volume
    print("\nWeekly order volume (ISO week):")
    weekly: defaultdict[str, int] = defaultdict(int)
    for r in rows:
        d = parse_date(r["order_date"])
        if d:
            iso = d.isocalendar()
            weekly[f"{iso.year}-W{iso.week:02d}"] += 1
    for week in sorted(weekly):
        print(f"  {week}: {weekly[week]}")

    # monthly orders by category
    print("\nMonthly orders by category (for forecasting baseline):")
    by_cat_month: defaultdict[tuple[str, str], int] = defaultdict(int)
    for r in rows:
        d = parse_date(r["order_date"])
        if d:
            ym = f"{d.year}-{d.month:02d}"
            by_cat_month[(r["product_category"], ym)] += 1
    cats = sorted({k[0] for k in by_cat_month})
    months = sorted({k[1] for k in by_cat_month})
    print(f"  Months: {len(months)}, Categories: {len(cats)}")
    for cat in cats:
        series = [by_cat_month[(cat, m)] for m in months]
        print(f"  {cat:8s}: {series}  total={sum(series)}")


if __name__ == "__main__":
    main()
