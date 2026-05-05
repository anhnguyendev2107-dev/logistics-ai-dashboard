import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (n: number, opts?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    ...opts,
  }).format(n);

export const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

export const formatDate = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
};
